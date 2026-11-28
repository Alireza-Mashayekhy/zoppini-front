/**
 * Reads the stock-check error responses from the backend.
 *
 * Every stage (add to cart, raising a quantity, placing the order, starting
 * payment) returns this shape:
 *   409 { code: 'INSUFFICIENT_STOCK', message, items: StockShortageItem[] }
 *   503 { code: 'STOCK_CHECK_UNAVAILABLE', message }
 *
 * The message is a ready-made Persian sentence from the backend; the frontend
 * only formats `items` to show beside the cart.
 */

export const STOCK_ERROR_CODES = {
  INSUFFICIENT: 'INSUFFICIENT_STOCK',
  UNAVAILABLE: 'STOCK_CHECK_UNAVAILABLE',
} as const;

export interface StockShortageItem {
  variantId: number;
  productId?: number | null;
  productTitle: string;
  variantLabel?: string | null;
  requested: number;
  available: number;
  inCart?: number;
}

export interface StockErrorInfo {
  code: (typeof STOCK_ERROR_CODES)[keyof typeof STOCK_ERROR_CODES];
  message: string;
  items: StockShortageItem[];
}

type ErrorLike = {
  message?: unknown;
  response?: { data?: unknown } | null;
} | null | undefined;

function responseBody(error: unknown): Record<string, unknown> | null {
  const data = (error as ErrorLike)?.response?.data;
  return data && typeof data === 'object'
    ? (data as Record<string, unknown>)
    : null;
}

/** پیام خوانا از خطای axios؛ پیام عمومی axios («Request failed…») نشان داده نمی‌شود */
export function apiErrorMessage(error: unknown, fallback: string): string {
  const message = responseBody(error)?.message;

  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message) && typeof message[0] === 'string') {
    return message[0];
  }

  return fallback;
}

function toItem(raw: unknown): StockShortageItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;
  const variantId = Number(item.variantId);
  if (!Number.isFinite(variantId)) return null;

  return {
    variantId,
    productId: item.productId == null ? null : Number(item.productId),
    productTitle: String(item.productTitle ?? '').trim() || 'محصول',
    variantLabel:
      typeof item.variantLabel === 'string' && item.variantLabel.trim()
        ? item.variantLabel.trim()
        : null,
    requested: Math.max(0, Number(item.requested) || 0),
    available: Math.max(0, Number(item.available) || 0),
    ...(item.inCart == null ? {} : { inCart: Number(item.inCart) || 0 }),
  };
}

/** اگر خطا از بررسی موجودی باشد، اطلاعات آن؛ وگرنه null */
export function readStockError(error: unknown): StockErrorInfo | null {
  const body = responseBody(error);
  const code = body?.code;

  if (
    code !== STOCK_ERROR_CODES.INSUFFICIENT &&
    code !== STOCK_ERROR_CODES.UNAVAILABLE
  ) {
    return null;
  }

  const items = Array.isArray(body?.items)
    ? (body.items as unknown[])
        .map(toItem)
        .filter((item): item is StockShortageItem => item !== null)
    : [];

  return {
    code,
    message: apiErrorMessage(
      error,
      code === STOCK_ERROR_CODES.INSUFFICIENT
        ? 'موجودی برخی کالاهای سبد خرید کافی نیست.'
        : 'در حال حاضر امکان بررسی موجودی وجود ندارد؛ لطفاً کمی بعد دوباره تلاش کنید.',
    ),
    items,
  };
}

const faNumber = (value: number) => value.toLocaleString('fa-IR');

/** «پیراهن – آبی / L» */
export function stockItemName(item: StockShortageItem): string {
  return item.variantLabel
    ? `${item.productTitle} – ${item.variantLabel}`
    : item.productTitle;
}

/** «موجود: ۱ عدد (درخواستی: ۲)» یا «ناموجود» */
export function stockItemAvailability(item: StockShortageItem): string {
  if (item.available <= 0) return 'ناموجود';
  return `موجود: ${faNumber(item.available)} عدد (درخواستی: ${faNumber(item.requested)})`;
}
