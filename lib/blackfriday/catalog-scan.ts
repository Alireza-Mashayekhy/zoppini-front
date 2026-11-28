import type { ApiListResponse } from '@/services/api/types';
import type { ProductsResponse } from '@/services/features/products/type';

/**
 * Resilient, complete scan of a paginated product listing.
 *
 * Why this is not a strict "all pages or throw" scan any more
 * -----------------------------------------------------------
 * The Black Friday landing reads two complete listings (campaign category
 * and the store-wide active-sale scope, ~1,050 products). The previous scan
 * threw the whole catalog away when:
 *   - any single page failed once (a 429 from the global Nest throttler, a
 *     5xx, a network blip), or
 *   - `pagination.total` changed between pages, or the de-duplicated count
 *     differed from `total`.
 * The listing is offset-paginated over `variant.stock > 0`, so every paid
 * order that sells the last unit of any product (order.service decrements
 * stock in place) shifts the window and changes `total` in the middle of a
 * scan. During the campaign this happened constantly, the scan threw, and
 * the landing rendered "0 products" while the category archive — which only
 * needs page 1 — kept working.
 *
 * Rules now:
 *   - A page that fails is retried with backoff (transient statuses only).
 *     A page that still fails fails the scan: a silently missing page is
 *     never presented as the catalog. Callers fall back to their last good
 *     snapshot instead.
 *   - Catalog drift (total changed / ids shifted) triggers one re-scan. If
 *     the listing is still moving, the union of the passes is returned
 *     (de-duplicated, latest data wins) and flagged `consistent: false`.
 *     Losing or briefly keeping one product that just sold out is far
 *     better than discarding ~1,000 valid ones.
 */

export type ProductPage = ApiListResponse<ProductsResponse>;

export type ScanLogger = Pick<Console, 'warn' | 'error'>;

export type ScanOptions = {
  /** Label used in log lines, e.g. `products/discounted`. */
  label?: string;
  /** Attempts per page, including the first one. */
  pageAttempts?: number;
  /** Base backoff in ms; doubled per attempt, longer for 429. */
  retryDelayMs?: number;
  /** Parallel page requests per batch. */
  concurrency?: number;
  /** Full passes allowed when the listing changes during the scan. */
  maxPasses?: number;
  sleep?: (ms: number) => Promise<void>;
  logger?: ScanLogger;
};

export type ScanResult = {
  products: ProductsResponse[];
  /** `pagination.total` reported by the last pass. */
  total: number;
  /** false when the listing kept changing; products are then a union. */
  consistent: boolean;
  passes: number;
  requests: number;
};

const defaultSleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

/** HTTP status carried by `ApiError` (or any error with a numeric status). */
export function errorStatus(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === 'number' ? status : undefined;
}

/**
 * Network errors/timeouts (no status), 408, 425, 429 and 5xx are transient.
 * Other 4xx (bad request, not found) will not heal by retrying.
 */
export function isTransientError(error: unknown): boolean {
  const status = errorStatus(error);
  if (status === undefined) return true;
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

export class InvalidCatalogPageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCatalogPageError';
  }
}

type PageMeta = { total: number; totalPages: number; page: number };

/** QueryDto pagination values are serialized as strings by the API. */
function readMeta(response: ProductPage, expectedPage: number): PageMeta {
  const meta = response?.pagination;
  const total = meta?.total == null ? NaN : Number(meta.total);
  const totalPages = meta?.totalPages == null ? NaN : Number(meta.totalPages);
  const page = Number(meta?.page);

  if (
    !Array.isArray(response?.data) ||
    !Number.isInteger(total) ||
    total < 0 ||
    !Number.isInteger(totalPages) ||
    totalPages < 0 ||
    (total > 0 && totalPages < 1) ||
    page !== expectedPage
  ) {
    throw new InvalidCatalogPageError(
      `Invalid product page ${expectedPage} (pagination ${JSON.stringify(meta ?? null)})`,
    );
  }

  return { total, totalPages, page };
}

function describe(error: unknown): string {
  const status = errorStatus(error);
  const message = error instanceof Error ? error.message : String(error);
  return status === undefined ? message : `HTTP ${status}: ${message}`;
}

export async function scanProductPages(
  fetchPage: (page: number) => Promise<ProductPage>,
  options: ScanOptions = {},
): Promise<ScanResult> {
  const {
    label = 'products',
    pageAttempts = 3,
    retryDelayMs = 400,
    concurrency = 3,
    maxPasses = 2,
    sleep = defaultSleep,
    logger = console,
  } = options;

  let requests = 0;

  const fetchWithRetry = async (
    page: number,
  ): Promise<{ response: ProductPage; meta: PageMeta }> => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= pageAttempts; attempt += 1) {
      try {
        requests += 1;
        const response = await fetchPage(page);
        return { response, meta: readMeta(response, page) };
      } catch (error) {
        lastError = error;
        const transient =
          error instanceof InvalidCatalogPageError || isTransientError(error);
        logger.warn(
          `[blackfriday:catalog] ${label} page ${page} attempt ${attempt}/${pageAttempts} failed (${describe(error)})${
            transient && attempt < pageAttempts ? ' – retrying' : ''
          }`,
        );
        if (!transient || attempt >= pageAttempts) break;
        const factor = errorStatus(error) === 429 ? 4 : 1;
        await sleep(retryDelayMs * factor * 2 ** (attempt - 1));
      }
    }
    throw lastError;
  };

  const runPass = async () => {
    const first = await fetchWithRetry(1);
    const { total, totalPages } = first.meta;
    const pages: ProductPage[] = [first.response];
    let drifted = false;

    for (let start = 2; start <= totalPages; start += concurrency) {
      const count = Math.min(concurrency, totalPages - start + 1);
      const batch = await Promise.all(
        Array.from({ length: count }, (_, offset) =>
          fetchWithRetry(start + offset),
        ),
      );
      for (const { response, meta } of batch) {
        if (meta.total !== total || meta.totalPages !== totalPages) {
          drifted = true;
        }
        pages.push(response);
      }
    }

    const products = pages.flatMap(page => page.data);
    const unique = new Set(products.map(product => product?.id));
    if (products.length !== total || unique.size !== total) drifted = true;

    return { products, total, drifted };
  };

  const passes: { products: ProductsResponse[]; total: number }[] = [];

  for (let pass = 1; pass <= maxPasses; pass += 1) {
    const result = await runPass();
    passes.push(result);

    if (!result.drifted) {
      return {
        products: uniqueById([result.products]),
        total: result.total,
        consistent: true,
        passes: pass,
        requests,
      };
    }

    logger.warn(
      `[blackfriday:catalog] ${label} changed during scan pass ${pass}/${maxPasses} (reported total ${result.total}, received ${result.products.length} rows / ${new Set(result.products.map(product => product?.id)).size} unique)${
        pass < maxPasses ? ' – rescanning' : ' – using union of passes'
      }`,
    );
  }

  // Latest pass first so its (fresher) product data wins on duplicates.
  const merged = uniqueById(
    [...passes].reverse().map(pass => pass.products),
  );
  return {
    products: merged,
    total: passes[passes.length - 1].total,
    consistent: false,
    passes: passes.length,
    requests,
  };
}

function uniqueById(groups: ProductsResponse[][]): ProductsResponse[] {
  const seen = new Set<number>();
  const result: ProductsResponse[] = [];
  for (const group of groups) {
    for (const product of group) {
      if (!product || seen.has(product.id)) continue;
      seen.add(product.id);
      result.push(product);
    }
  }
  return result;
}
