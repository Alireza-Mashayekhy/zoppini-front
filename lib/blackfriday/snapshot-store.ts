/**
 * Last-known-good snapshot with single-flight refresh.
 *
 * Guarantees, per source (campaign catalog, discounted catalog, categories):
 *   1. Concurrent renders share one in-flight load (no duplicate scans, no
 *      burst of backend requests that trips the shared-IP throttler).
 *   2. A fresh snapshot (< `freshMs`) is served without any backend request.
 *   3. A stale snapshot is served immediately while one background refresh
 *      runs (stale-while-revalidate), up to `maxStaleMs`.
 *   4. A failed refresh never replaces good data; the previous snapshot keeps
 *      being served (stale-if-error) and the failure is logged.
 *   5. An empty result never replaces a non-empty snapshot on the first
 *      sighting. It must be confirmed by `emptyConfirmations` consecutive
 *      successful loads (so a campaign that really ended still empties out).
 *
 * The store is framework-free and takes its clock/loader as arguments so
 * it can be unit-tested deterministically.
 */

export type SnapshotState = 'fresh' | 'stale' | 'unavailable';

export type SnapshotRead<T> = {
  value: T | null;
  state: SnapshotState;
  /** epoch ms of the data being served */
  fetchedAt: number | null;
  /** last refresh error message, if the served data is a fallback */
  error?: string;
};

export type SnapshotLogger = Pick<Console, 'warn' | 'error' | 'info'>;

export type SnapshotStoreOptions<T> = {
  name: string;
  load: () => Promise<T>;
  /** Item count used for the empty-result guard. */
  size: (value: T) => number;
  freshMs: number;
  maxStaleMs: number;
  emptyConfirmations?: number;
  /**
   * After a failed load, wait this long before starting another one. Keeps
   * a struggling backend from being hammered by every incoming render.
   */
  failureCooldownMs?: number;
  now?: () => number;
  logger?: SnapshotLogger;
};

export type ReadOptions = {
  /**
   * When there is no usable snapshot, wait at most this long for the load.
   * On timeout the caller gets `unavailable` while the load keeps running in
   * the background (a later read/recovery request picks up its result).
   */
  maxWaitMs?: number;
};

export type SnapshotStore<T> = {
  /** Serve the best available data; loads synchronously only when needed. */
  read: (options?: ReadOptions) => Promise<SnapshotRead<T>>;
  /** Force a refresh (shares an in-flight one). */
  refresh: () => Promise<SnapshotRead<T>>;
  /** Test/diagnostics helper. */
  peek: () => { value: T | null; fetchedAt: number | null; inFlight: boolean };
};

export function createSnapshotStore<T>(
  options: SnapshotStoreOptions<T>,
): SnapshotStore<T> {
  const {
    name,
    load,
    size,
    freshMs,
    maxStaleMs,
    emptyConfirmations = 2,
    failureCooldownMs = 10_000,
    now = Date.now,
    logger = console,
  } = options;

  let value: T | null = null;
  let fetchedAt: number | null = null;
  let lastError: string | undefined;
  let pendingEmpty = 0;
  let lastFailureAt: number | null = null;
  let inFlight: Promise<SnapshotRead<T>> | null = null;

  const current = (): SnapshotRead<T> => {
    if (value === null || fetchedAt === null) {
      return { value: null, state: 'unavailable', fetchedAt: null, error: lastError };
    }
    const age = now() - fetchedAt;
    if (age > maxStaleMs) {
      return { value: null, state: 'unavailable', fetchedAt, error: lastError };
    }
    return {
      value,
      state: age < freshMs ? 'fresh' : 'stale',
      fetchedAt,
      ...(lastError ? { error: lastError } : {}),
    };
  };

  const runLoad = async (): Promise<SnapshotRead<T>> => {
    const startedAt = now();
    try {
      const next = await load();
      const nextSize = size(next);
      const previousSize = value === null ? null : size(value);

      if (nextSize === 0 && previousSize !== null && previousSize > 0) {
        pendingEmpty += 1;
        if (pendingEmpty < emptyConfirmations) {
          logger.warn(
            `[blackfriday:snapshot] ${name}: unexpected empty result (previous snapshot had ${previousSize} items); keeping previous data until confirmed (${pendingEmpty}/${emptyConfirmations})`,
          );
          return current();
        }
        logger.warn(
          `[blackfriday:snapshot] ${name}: empty result confirmed ${pendingEmpty} times; accepting it`,
        );
      } else if (nextSize === 0) {
        logger.warn(
          `[blackfriday:snapshot] ${name}: load succeeded but returned 0 items`,
        );
      }

      pendingEmpty = nextSize === 0 ? pendingEmpty : 0;
      value = next;
      fetchedAt = now();
      lastError = undefined;
      lastFailureAt = null;
      logger.info?.(
        `[blackfriday:snapshot] ${name}: refreshed ${nextSize} items in ${fetchedAt - startedAt}ms`,
      );
      return current();
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      lastFailureAt = now();
      const fallback = current();
      const ageSeconds =
        fetchedAt === null ? null : Math.round((now() - fetchedAt) / 1000);
      logger.error(
        `[blackfriday:snapshot] ${name}: refresh failed after ${now() - startedAt}ms (${lastError}); ${
          fallback.value === null
            ? 'no usable snapshot – section will report unavailable'
            : `serving last good snapshot (age ${ageSeconds}s)`
        }`,
      );
      return fallback;
    }
  };

  const refresh = (): Promise<SnapshotRead<T>> => {
    if (!inFlight) {
      inFlight = runLoad().finally(() => {
        inFlight = null;
      });
    }
    return inFlight;
  };

  const coolingDown = () =>
    lastFailureAt !== null && now() - lastFailureAt < failureCooldownMs;

  const waitFor = (
    load: Promise<SnapshotRead<T>>,
    maxWaitMs: number | undefined,
  ): Promise<SnapshotRead<T>> => {
    if (maxWaitMs === undefined) return load;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<SnapshotRead<T>>(resolve => {
      timer = setTimeout(() => {
        logger.warn(
          `[blackfriday:snapshot] ${name}: no snapshot yet and load still running after ${maxWaitMs}ms; responding unavailable, load continues in background`,
        );
        resolve(current());
      }, maxWaitMs);
    });
    return Promise.race([load, timeout]).finally(() => clearTimeout(timer));
  };

  const read = async (
    readOptions: ReadOptions = {},
  ): Promise<SnapshotRead<T>> => {
    const snapshot = current();
    if (snapshot.state === 'fresh') return snapshot;
    if (inFlight) {
      // Someone is already loading: stale data now, or wait for the load.
      return snapshot.state === 'stale'
        ? snapshot
        : waitFor(inFlight, readOptions.maxWaitMs);
    }
    if (coolingDown()) return snapshot;
    if (snapshot.state === 'stale') {
      // Serve immediately; refresh once in the background.
      void refresh();
      return snapshot;
    }
    return waitFor(refresh(), readOptions.maxWaitMs);
  };

  return {
    read,
    refresh,
    peek: () => ({ value, fetchedAt, inFlight: inFlight !== null }),
  };
}
