import { NextResponse } from 'next/server';

import {
  getBlackFridayCollectionData,
  RECOVERY_COLD_WAIT_MS,
} from '@/lib/blackfriday/collection-source';

/**
 * Client-side recovery for the landing collection.
 *
 * If the server render could not compute the eligible products (cold start
 * plus a backend failure), `ProductCollection` retries here with backoff
 * instead of reloading the whole page. It serves the same shared snapshot as
 * the page, so a retry never starts a second concurrent scan.
 *
 * Lives under `/landing/...` (not `/api/...`) because `/api/*` on the public
 * host is routed to the Nest backend.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getBlackFridayCollectionData({
      maxWaitMs: RECOVERY_COLD_WAIT_MS,
    });

    return NextResponse.json(
      {
        products: data.eligibleProducts,
        categories: data.collectionCategories,
        unavailable: data.unavailable,
        state: data.state,
        fetchedAt: data.fetchedAt,
      },
      {
        status: data.unavailable ? 503 : 200,
        headers: {
          'Cache-Control': 'no-store',
          ...(data.unavailable ? { 'Retry-After': '5' } : {}),
        },
      },
    );
  } catch (error) {
    console.error('[blackfriday:route] collection request failed', error);
    return NextResponse.json(
      { products: [], categories: [], unavailable: true, state: 'unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '5' } },
    );
  }
}
