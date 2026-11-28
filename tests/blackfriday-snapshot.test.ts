import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createSnapshotStore } from '../lib/blackfriday/snapshot-store';

const silent = { warn: () => {}, error: () => {}, info: () => {} };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(load: () => Promise<number[]>, overrides = {}) {
  let clock = 1_000_000;
  const logs: string[] = [];
  const logger = {
    warn: (message: string) => logs.push(`warn ${message}`),
    error: (message: string) => logs.push(`error ${message}`),
    info: () => {},
  };
  const store = createSnapshotStore<number[]>({
    name: 'test',
    load,
    size: value => value.length,
    freshMs: 60_000,
    maxStaleMs: 15 * 60_000,
    failureCooldownMs: 10_000,
    now: () => clock,
    logger,
    ...overrides,
  });
  return {
    store,
    logs,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('concurrent renders share one in-flight load (no duplicate scans)', async () => {
  let loads = 0;
  const gate = deferred<number[]>();
  const { store } = setup(() => {
    loads += 1;
    return gate.promise;
  });

  const reads = Array.from({ length: 10 }, () => store.read());
  gate.resolve([1, 2, 3]);
  const results = await Promise.all(reads);

  assert.equal(loads, 1);
  for (const result of results) {
    assert.equal(result.state, 'fresh');
    assert.deepEqual(result.value, [1, 2, 3]);
  }
});

test('a fresh snapshot is served without another backend load', async () => {
  let loads = 0;
  const { store, advance } = setup(async () => {
    loads += 1;
    return [1];
  });
  await store.read();
  advance(59_000);
  await store.read();
  await store.read();
  assert.equal(loads, 1);
});

test('a stale snapshot is served immediately while one background refresh runs', async () => {
  let loads = 0;
  const gate = deferred<number[]>();
  const { store, advance } = setup(() => {
    loads += 1;
    return loads === 1 ? Promise.resolve([1, 2]) : gate.promise;
  });
  await store.read();
  advance(61_000);

  const [a, b] = await Promise.all([store.read(), store.read()]);
  assert.equal(a.state, 'stale');
  assert.deepEqual(a.value, [1, 2]);
  assert.deepEqual(b.value, [1, 2]);
  assert.equal(loads, 2); // exactly one background refresh

  gate.resolve([1, 2, 3]);
  await flush();
  const after = await store.read();
  assert.equal(after.state, 'fresh');
  assert.deepEqual(after.value, [1, 2, 3]);
});

test('a failed refresh never replaces the last good snapshot (stale-if-error) and is logged', async () => {
  let loads = 0;
  const { store, advance, logs } = setup(async () => {
    loads += 1;
    if (loads > 1) throw new Error('Request failed: 429');
    return [1, 2, 3];
  });
  await store.read();
  advance(61_000);

  const served = await store.refresh();
  assert.equal(served.state, 'stale');
  assert.deepEqual(served.value, [1, 2, 3]);
  assert.match(served.error ?? '', /429/);
  assert.ok(logs.some(line => /refresh failed.*serving last good snapshot/.test(line)));
});

test('an unexpected empty result must be confirmed before it replaces products', async () => {
  const results = [[1, 2, 3], [], []];
  const { store, advance, logs } = setup(async () => results.shift()!);
  await store.read();

  advance(61_000);
  const first = await store.refresh();
  assert.deepEqual(first.value, [1, 2, 3]);
  assert.ok(logs.some(line => /unexpected empty result/.test(line)));

  advance(61_000);
  const second = await store.refresh();
  assert.deepEqual(second.value, []); // confirmed twice → accepted
});

test('an empty blip between two good results never reaches the page', async () => {
  const results = [[1, 2], [], [1, 2, 4]];
  const { store, advance } = setup(async () => results.shift()!);
  await store.read();
  advance(61_000);
  assert.deepEqual((await store.refresh()).value, [1, 2]);
  advance(61_000);
  assert.deepEqual((await store.refresh()).value, [1, 2, 4]);
});

test('cold-start failure reports unavailable, with a cooldown, then recovers', async () => {
  let loads = 0;
  const { store, advance } = setup(async () => {
    loads += 1;
    if (loads === 1) throw new Error('fetch failed');
    return [7];
  });

  const failed = await store.read();
  assert.equal(failed.state, 'unavailable');
  assert.equal(failed.value, null);

  // Within the cooldown, renders do not hammer the backend.
  const cooled = await store.read();
  assert.equal(cooled.state, 'unavailable');
  assert.equal(loads, 1);

  advance(10_001);
  const recovered = await store.read();
  assert.equal(recovered.state, 'fresh');
  assert.deepEqual(recovered.value, [7]);
});

test('snapshots older than maxStale are not served', async () => {
  let loads = 0;
  const { store, advance } = setup(
    async () => {
      loads += 1;
      if (loads > 1) throw new Error('down');
      return [1];
    },
    { maxStaleMs: 120_000 },
  );
  await store.read();
  advance(121_000);
  const result = await store.read();
  assert.equal(result.state, 'unavailable');
  assert.equal(result.value, null);
});

test('a cold render waits at most maxWaitMs; the load continues and later reads get it', async () => {
  let loads = 0;
  const gate = deferred<number[]>();
  const store = createSnapshotStore<number[]>({
    name: 'slow',
    load: () => {
      loads += 1;
      return gate.promise;
    },
    size: value => value.length,
    freshMs: 60_000,
    maxStaleMs: 900_000,
    logger: silent,
  });

  const started = Date.now();
  const page = await store.read({ maxWaitMs: 30 });
  assert.equal(page.state, 'unavailable');
  assert.ok(Date.now() - started < 1_000);
  assert.equal(store.peek().inFlight, true);

  // The recovery endpoint joins the same in-flight load (no second scan).
  const recovery = store.read({ maxWaitMs: 5_000 });
  gate.resolve([1, 2]);
  const recovered = await recovery;
  assert.equal(recovered.state, 'fresh');
  assert.deepEqual(recovered.value, [1, 2]);
  assert.equal(loads, 1);
});

test('silent logger is accepted', () => {
  createSnapshotStore({
    name: 'x',
    load: async () => [],
    size: (value: unknown[]) => value.length,
    freshMs: 1,
    maxStaleMs: 2,
    logger: silent,
  });
});
