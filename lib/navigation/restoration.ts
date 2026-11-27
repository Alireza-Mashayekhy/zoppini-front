'use client';

/** A bounded, per-history-entry snapshot used only when returning from a product. */
const ENTRY_KEY = '__zpListingEntry';
const STORAGE_PREFIX = 'zp:listing-entry:';
const MAX_ENTRIES = 8;
const MAX_AGE_MS = 30 * 60 * 1000;

type SnapshotProvider = () => unknown;
type ScrollContainer = { path: string; top: number; left: number };
export type ListingSnapshot = {
  url: string;
  productPath: string;
  scrollY: number;
  anchorTop: number;
  anchorIndex: number;
  containers: ScrollContainer[];
  states: Record<string, unknown>;
  createdAt: number;
};

const providers = new Map<string, SnapshotProvider>();
const memory = new Map<string, ListingSnapshot>();
let pending: ListingSnapshot | null = null;
const ready = new Set<string>();

export function registerListingSnapshot(
  key: string,
  provider: SnapshotProvider,
) {
  providers.set(key, provider);
  return () => {
    if (providers.get(key) === provider) providers.delete(key);
  };
}

export function getPendingListingState<T>(key: string): T | undefined {
  return pending?.states[key] as T | undefined;
}

export function markListingReady(key: string) {
  ready.add(key);
  window.dispatchEvent(new Event('zp:listing-ready'));
}

export function getPendingListingSnapshot() {
  return pending;
}

export function isListingReady(snapshot: ListingSnapshot) {
  return Object.keys(snapshot.states).every(key => ready.has(key));
}

export function clearPendingListingSnapshot() {
  pending = null;
  ready.clear();
}

function productPath(anchor: HTMLAnchorElement): string | null {
  const url = new URL(anchor.href, window.location.href);
  return url.origin === window.location.origin &&
    /^\/product\/[^/]+\/?$/.test(url.pathname)
    ? url.pathname
    : null;
}

function productLinks(path: string): HTMLAnchorElement[] {
  return Array.from(
    document.querySelectorAll<HTMLAnchorElement>('a[href]'),
  ).filter(anchor => productPath(anchor) === path);
}

function elementPath(element: Element): string {
  const segments: string[] = [];
  for (
    let node: Element | null = element;
    node && node !== document.documentElement;
    node = node.parentElement
  ) {
    const parent: Element | null = node.parentElement;
    if (!parent) break;
    const siblings = Array.from(parent.children).filter(
      child => child.tagName === node!.tagName,
    );
    segments.unshift(
      `${node.tagName.toLowerCase()}:nth-of-type(${siblings.indexOf(node) + 1})`,
    );
  }
  return `html > ${segments.join(' > ')}`;
}

function scrollContainers(anchor: Element): ScrollContainer[] {
  const result: ScrollContainer[] = [];
  for (
    let node = anchor.parentElement;
    node && node !== document.body;
    node = node.parentElement
  ) {
    const style = getComputedStyle(node);
    if (
      (/(auto|scroll)/.test(style.overflowY) &&
        node.scrollHeight > node.clientHeight) ||
      (/(auto|scroll)/.test(style.overflowX) &&
        node.scrollWidth > node.clientWidth)
    ) {
      result.push({
        path: elementPath(node),
        top: node.scrollTop,
        left: node.scrollLeft,
      });
    }
  }
  return result;
}

function remember(id: string, snapshot: ListingSnapshot) {
  memory.set(id, snapshot);
  while (memory.size > MAX_ENTRIES) memory.delete(memory.keys().next().value!);
  try {
    const keys = Object.keys(sessionStorage).filter(key =>
      key.startsWith(STORAGE_PREFIX),
    );
    for (const key of keys) {
      try {
        const value = JSON.parse(
          sessionStorage.getItem(key) ?? 'null',
        ) as ListingSnapshot | null;
        if (!value || Date.now() - value.createdAt > MAX_AGE_MS)
          sessionStorage.removeItem(key);
      } catch {
        sessionStorage.removeItem(key);
      }
    }
    const remaining = Object.keys(sessionStorage).filter(key =>
      key.startsWith(STORAGE_PREFIX),
    );
    while (remaining.length >= MAX_ENTRIES)
      sessionStorage.removeItem(remaining.shift()!);
    sessionStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(snapshot));
  } catch {
    // Restricted storage or quota: the in-memory snapshot still works in this tab.
  }
}

function read(id: string): ListingSnapshot | null {
  let snapshot = memory.get(id) ?? null;
  if (!snapshot) {
    try {
      snapshot = JSON.parse(
        sessionStorage.getItem(STORAGE_PREFIX + id) ?? 'null',
      );
    } catch {
      return null;
    }
  }
  if (!snapshot || Date.now() - snapshot.createdAt > MAX_AGE_MS) return null;
  return snapshot;
}

/** Called in the capture phase, before Next.js leaves the listing entry. */
export function captureProductNavigation(event: MouseEvent) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  const element = event.target instanceof Element ? event.target : null;
  const anchor = element?.closest<HTMLAnchorElement>('a[href]');
  if (
    !anchor ||
    (anchor.target && anchor.target !== '_self') ||
    anchor.hasAttribute('download')
  )
    return;
  const path = productPath(anchor);
  if (!path || /^\/product\/[^/]+\/?$/.test(window.location.pathname)) return;

  const id =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const states: Record<string, unknown> = {};
  providers.forEach((provider, key) => {
    states[key] = provider();
  });
  const card = anchor.closest('[data-product-card]') ?? anchor;
  const snapshot: ListingSnapshot = {
    url:
      window.location.pathname + window.location.search + window.location.hash,
    productPath: path,
    scrollY: window.scrollY,
    anchorTop: card.getBoundingClientRect().top,
    anchorIndex: productLinks(path).indexOf(anchor),
    containers: scrollContainers(anchor),
    states,
    createdAt: Date.now(),
  };
  remember(id, snapshot);
  window.history.replaceState({ ...window.history.state, [ENTRY_KEY]: id }, '');
}

/** Only a Back/Forward traversal from that product may consume this entry. */
export function prepareListingRestoration(
  state: unknown,
  fromPath: string,
): ListingSnapshot | null {
  clearPendingListingSnapshot();
  const id = (state as Record<string, unknown> | null)?.[ENTRY_KEY];
  if (typeof id !== 'string') return null;
  const snapshot = read(id);
  const current =
    window.location.pathname + window.location.search + window.location.hash;
  if (
    !snapshot ||
    snapshot.url !== current ||
    snapshot.productPath !== fromPath
  )
    return null;
  pending = snapshot;
  return snapshot;
}

export function restoreListingPosition(snapshot: ListingSnapshot) {
  for (const container of snapshot.containers) {
    const element = document.querySelector<HTMLElement>(container.path);
    if (element) {
      element.scrollTop = container.top;
      element.scrollLeft = container.left;
    }
  }
  const anchors = productLinks(snapshot.productPath);
  const anchor =
    anchors[snapshot.anchorIndex] ??
    anchors.find(item => item.getClientRects().length > 0);
  const card = anchor?.closest('[data-product-card]') ?? anchor;
  const top =
    card && card.getClientRects().length > 0
      ? window.scrollY + card.getBoundingClientRect().top - snapshot.anchorTop
      : snapshot.scrollY;
  window.scrollTo({
    top: Math.max(
      0,
      Math.min(top, document.documentElement.scrollHeight - window.innerHeight),
    ),
    behavior: 'instant',
  });
}
