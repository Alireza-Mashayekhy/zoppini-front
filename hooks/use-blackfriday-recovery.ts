'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  parseRecoveryPayload,
  RECOVERY_DELAYS_MS,
  RECOVERY_ENDPOINT,
  RECOVERY_TIMEOUT_MS,
  type RecoveryPayload,
  shouldAcceptRecovery,
} from '@/lib/blackfriday/recovery';
import type { CategoriesResponse } from '@/services/features/categories/types';
import type { ProductsResponse } from '@/services/features/products/type';

export type RecoveryStatus = 'idle' | 'loading' | 'failed' | 'recovered';

type Recovered = {
  products: ProductsResponse[];
  categories: CategoriesResponse[];
};

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    if (ms <= 0) return resolve();
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

async function requestOnce(signal: AbortSignal): Promise<RecoveryPayload | null> {
  const attempt = new AbortController();
  const abort = () => attempt.abort(signal.reason);
  signal.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(
    () => attempt.abort(new Error('Recovery request timed out')),
    RECOVERY_TIMEOUT_MS,
  );

  try {
    const response = await fetch(RECOVERY_ENDPOINT, {
      cache: 'no-store',
      signal: attempt.signal,
      headers: { Accept: 'application/json' },
    });
    const body = await response.json().catch(() => null);
    const payload = parseRecoveryPayload(body);
    if (!response.ok || !payload || payload.unavailable) {
      console.error(
        `[blackfriday:collection] recovery request failed (HTTP ${response.status}, state ${payload?.state ?? 'invalid body'})`,
      );
      return payload ?? null;
    }
    return payload;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}

/**
 * Re-fetch the eligible collection when the server render could not.
 *
 * - One recovery run at a time (ref guard + AbortController): no duplicate
 *   requests from double effects, repeated clicks or the `online` event.
 * - Backoff between attempts; the run stops at the first acceptable answer.
 * - A response only replaces the list when `shouldAcceptRecovery` allows it,
 *   so an empty/unavailable answer never overwrites valid products.
 * - Aborted on unmount; abandoned responses are ignored.
 */
export function useBlackFridayRecovery({
  needed,
  products,
}: {
  /** true when the server reported the collection as unavailable */
  needed: boolean;
  products: ProductsResponse[];
}) {
  const [status, setStatus] = useState<RecoveryStatus>(
    needed ? 'loading' : 'idle',
  );
  const [recovered, setRecovered] = useState<Recovered | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const productsRef = useRef(products);
  useEffect(() => {
    productsRef.current = recovered?.products ?? products;
  }, [recovered, products]);

  const run = useCallback(async () => {
    if (controllerRef.current) return; // already running
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      for (let index = 0; index < RECOVERY_DELAYS_MS.length; index += 1) {
        await wait(RECOVERY_DELAYS_MS[index], controller.signal);
        let payload: RecoveryPayload | null = null;
        try {
          payload = await requestOnce(controller.signal);
        } catch (error) {
          if (controller.signal.aborted) return;
          console.error(
            `[blackfriday:collection] recovery attempt ${index + 1}/${RECOVERY_DELAYS_MS.length} failed`,
            error,
          );
          continue;
        }
        if (controller.signal.aborted) return;

        if (shouldAcceptRecovery(productsRef.current, payload)) {
          if (payload && payload.products.length === 0) {
            console.warn(
              '[blackfriday:collection] recovery returned an authoritative empty collection',
            );
          }
          setRecovered({
            products: payload!.products,
            categories: payload!.categories,
          });
          setStatus('recovered');
          return;
        }
      }
      if (!controller.signal.aborted) {
        console.error(
          `[blackfriday:collection] collection still unavailable after ${RECOVERY_DELAYS_MS.length} attempts`,
        );
        setStatus('failed');
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error('[blackfriday:collection] recovery aborted', error);
        setStatus('failed');
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!needed) return;
    // Scheduled (not called inline) so no state update happens during the
    // effect itself; cleanup cancels both the timer and an in-flight run.
    const timer = setTimeout(() => void run(), 0);
    return () => {
      clearTimeout(timer);
      controllerRef.current?.abort(new Error('unmounted'));
      controllerRef.current = null;
    };
  }, [needed, run]);

  /** User/event-triggered retry; the initial run starts in 'loading'. */
  const retry = useCallback(() => {
    if (controllerRef.current) return;
    setStatus('loading');
    void run();
  }, [run]);

  // Coming back online after a failed run → try again automatically.
  useEffect(() => {
    if (status !== 'failed') return;
    const onOnline = () => retry();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [status, retry]);

  return { status, recovered, retry };
}
