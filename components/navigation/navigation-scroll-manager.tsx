'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef } from 'react';

import {
  captureProductNavigation,
  clearPendingListingSnapshot,
  getPendingListingSnapshot,
  isListingReady,
  prepareListingRestoration,
  restoreListingPosition,
} from '@/lib/navigation/restoration';

const isProduct = (path: string) => /^\/product\/[^/]+\/?$/.test(path);

/** Coordinates route starts and product-return snapshots; Next retains native history control. */
export default function NavigationScrollManager() {
  const pathname = usePathname();
  const committedPath = useRef(pathname);
  const popPath = useRef<string | null>(null);
  const cancelRestore = useRef<(() => void) | null>(null);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      cancelRestore.current?.();
      popPath.current = window.location.pathname;
      const snapshot = prepareListingRestoration(
        event.state,
        committedPath.current,
      );
      if (snapshot)
        document.documentElement.setAttribute('data-zp-scroll-restoring', '');
    };
    const onPageShow = () => {
      if (isProduct(window.location.pathname) && !window.location.hash) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };
    document.addEventListener('click', captureProductNavigation, true);
    window.addEventListener('popstate', onPopState);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      cancelRestore.current?.();
      document.removeEventListener('click', captureProductNavigation, true);
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, []);

  useLayoutEffect(() => {
    if (!pathname) return;
    const previous = committedPath.current;
    const changed = previous !== pathname;
    const isPop = popPath.current === pathname;
    committedPath.current = pathname;
    if (!changed) return;
    popPath.current = null;
    cancelRestore.current?.();

    const snapshot = isPop ? getPendingListingSnapshot() : null;
    if (snapshot) {
      let cancelled = false;
      let frame = 0;
      let fontsReady = false;
      const root = document.documentElement;
      root.setAttribute('data-zp-scroll-restoring', '');
      const finish = () => {
        if (cancelled) return;
        cancelled = true;
        cancelAnimationFrame(frame);
        clearTimeout(fallback);
        observer.disconnect();
        window.removeEventListener('zp:listing-ready', schedule);
        window.removeEventListener('wheel', cancel);
        window.removeEventListener('touchstart', cancel);
        window.removeEventListener('keydown', cancel);
        root.removeAttribute('data-zp-scroll-restoring');
        clearPendingListingSnapshot();
        cancelRestore.current = null;
      };
      const cancel = () => finish();
      const perform = (fallbackOnly = false) => {
        if (
          cancelled ||
          (!fallbackOnly && (!fontsReady || !isListingReady(snapshot)))
        )
          return;
        restoreListingPosition(snapshot);
        finish();
      };
      const schedule = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => perform());
      };
      const observer = new MutationObserver(schedule);
      observer.observe(document.body, { childList: true, subtree: true });
      window.addEventListener('zp:listing-ready', schedule);
      window.addEventListener('wheel', cancel, { passive: true, once: true });
      window.addEventListener('touchstart', cancel, {
        passive: true,
        once: true,
      });
      window.addEventListener('keydown', cancel, { once: true });
      // Safety fallback only: unavailable listing state must never trap restoration.
      const fallback = window.setTimeout(() => perform(true), 3000);
      cancelRestore.current = cancel;
      void (document.fonts?.ready ?? Promise.resolve()).then(() => {
        fontsReady = true;
        schedule();
      });
      return;
    }

    clearPendingListingSnapshot();
    document.documentElement.removeAttribute('data-zp-scroll-restoring');
    if (!window.location.hash && (!isPop || isProduct(pathname))) {
      // Next handles ordinary route starts. Product pages and exits from a
      // snapping landing page need an explicit instant start.
      if (
        isProduct(pathname) ||
        previous === '/' ||
        previous === '/landing/blackfriday'
      ) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      document
        .querySelectorAll<HTMLElement>('[data-navigation-scroll-root]')
        .forEach(node => {
          node.scrollTop = 0;
        });
    }
  }, [pathname]);

  useLayoutEffect(() => {
    // Direct product visits and reloads have the same starting point as a new link.
    if (pathname && isProduct(pathname) && !window.location.hash) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    // Only the first mount; subsequent route changes are handled above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
