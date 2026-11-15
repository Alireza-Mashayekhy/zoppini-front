/**
 * وضعیت‌های سفارش و قواعدِ نمایش/اقدامِ مرتبط با آن‌ها — یک منبعِ واحد.
 *
 * چرا این ماژول وجود دارد:
 * قبل از این، هر کامپوننت یک نگاشتِ جداگانه از وضعیت به برچسب داشت
 * (`components/dashboard/order-item.tsx` و `components/dashboard/recent-orders.tsx`)
 * و کارت‌های خلاصه‌ی داشبورد مقدارِ `stats.cancelled` را زیر برچسب
 * «تحویل شده» نشان می‌دادند. نتیجه: یک سفارشِ لغوشده «تحویل شده» دیده می‌شد.
 *
 * قواعد این ماژول:
 * ۱. وضعیت‌ها دقیقاً همان مقادیرِ دیتابیس هستند و صریحاً نگاشت می‌شوند؛
 * ۲. هیچ وضعیتی از روی «نبودِ مقدار»، «truthy بودن» یا شباهتِ اسمی حدس زده
 *    نمی‌شود؛
 * ۳. وضعیتِ ناشناس/جدید هرگز به‌عنوان «تحویل شده» یا «لغو شده» شمرده نمی‌شود
 *    و فقط برچسبِ «نامشخص» می‌گیرد؛
 * ۴. اقدام‌ها (پرداخت/لغو) فقط برای وضعیتی پیشنهاد می‌شوند که سرور هم همان را
 *    می‌پذیرد تا دکمه‌ای که کار نمی‌کند نشان داده نشود.
 */

/** وضعیت‌های واقعی سفارش (هم‌نام با enum سمت بک‌اند) */
export const ORDER_STATUSES = [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

/** کلیدهایی که در شمارشِ خلاصه استفاده می‌کنیم */
export type OrderStatusCountKey = OrderStatusValue | 'unknown';

export type OrderStatusTone =
  | 'warning'
  | 'info'
  | 'processing'
  | 'success'
  | 'danger'
  | 'neutral';

export interface OrderStatusMeta {
  /** وضعیت واقعی یا `'unknown'` برای مقادیر ناشناس/خالی */
  status: OrderStatusCountKey;
  /** برچسبی که مشتری می‌فهمد */
  label: string;
  /** برچسب کوتاه برای فضاهای تنگ (بدجه) */
  shortLabel: string;
  /** یک جمله‌ی توضیح درباره‌ی این وضعیت */
  description: string;
  /** گام بعدیِ مشتری در این وضعیت؛ `null` یعنی گام خاصی ندارد */
  nextAction: string | null;
  tone: OrderStatusTone;
  badgeClassName: string;
  dotClassName: string;
}

const META: Record<OrderStatusValue, OrderStatusMeta> = {
  pending: {
    status: 'pending',
    label: 'در انتظار پرداخت',
    shortLabel: 'در انتظار پرداخت',
    description: 'سفارش ثبت شده و هنوز پرداخت آن انجام نشده است.',
    nextAction: 'برای نهایی شدن سفارش، پرداخت را انجام دهید.',
    tone: 'warning',
    badgeClassName: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    dotClassName: 'bg-amber-500',
  },
  paid: {
    status: 'paid',
    label: 'پرداخت شده',
    shortLabel: 'پرداخت شده',
    description: 'پرداخت شما تأیید شده و سفارش در حال آماده‌سازی است.',
    nextAction: null,
    tone: 'info',
    badgeClassName: 'bg-sky-50 text-sky-800 ring-1 ring-sky-200',
    dotClassName: 'bg-sky-500',
  },
  shipped: {
    status: 'shipped',
    label: 'ارسال شده',
    shortLabel: 'ارسال شده',
    description: 'سفارش تحویل پست یا پیک داده شده است.',
    nextAction: null,
    tone: 'processing',
    badgeClassName: 'bg-violet-50 text-violet-800 ring-1 ring-violet-200',
    dotClassName: 'bg-violet-500',
  },
  delivered: {
    status: 'delivered',
    label: 'تحویل شده',
    shortLabel: 'تحویل شده',
    description: 'سفارش به دست شما رسیده است.',
    nextAction: null,
    tone: 'success',
    badgeClassName: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
    dotClassName: 'bg-emerald-500',
  },
  cancelled: {
    status: 'cancelled',
    label: 'لغو شده',
    shortLabel: 'لغو شده',
    description: 'این سفارش لغو شده و در شمارش سفارش‌های تحویلی نمی‌آید.',
    nextAction: null,
    tone: 'danger',
    badgeClassName: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200',
    dotClassName: 'bg-rose-500',
  },
};

/**
 * وضعیتِ ناشناس (مقدار خالی، تهی، یا وضعیتی که بعداً به سیستم اضافه شده).
 *
 * عمداً نه «تحویل شده» است و نه «لغو شده» تا عددِ هیچ کارت خلاصه‌ای
 * به‌اشتباه بالا نرود.
 */
export const UNKNOWN_ORDER_STATUS_META: OrderStatusMeta = {
  status: 'unknown',
  label: 'وضعیت نامشخص',
  shortLabel: 'نامشخص',
  description: 'وضعیت این سفارش در حال به‌روزرسانی است.',
  nextAction: null,
  tone: 'neutral',
  badgeClassName: 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200',
  dotClassName: 'bg-neutral-400',
};

export function isOrderStatus(value: unknown): value is OrderStatusValue {
  return (
    typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value)
  );
}

/** نگاشتِ امنِ وضعیت به برچسب و رنگ؛ برای مقدارِ ناشناس هیچ‌وقت خطا نمی‌دهد. */
export function getOrderStatusMeta(status: unknown): OrderStatusMeta {
  return isOrderStatus(status) ? META[status] : UNKNOWN_ORDER_STATUS_META;
}

/** برچسبِ قابل‌نمایش برای هر مقداری (حتی خالی/ناشناس) */
export function getOrderStatusLabel(status: unknown): string {
  return getOrderStatusMeta(status).label;
}

/**
 * آیا این وضعیت «در جریان» است؟
 *
 * تعریفِ صریح: هر وضعیتی که نه لغو شده و نه تحویل شده. وضعیتِ ناشناس هم در
 * جریان فرض می‌شود تا سفارشِ مشتری از دید او گم نشود؛ اما در شمارش‌ها جدا
 * نگه داشته می‌شود (هیچ‌وقت تحویل‌شده حساب نمی‌شود).
 */
export function isOrderInProgress(status: unknown): boolean {
  if (!isOrderStatus(status)) return true;

  return status !== 'cancelled' && status !== 'delivered';
}

/* ==================================================================== */
/* شمارشِ وضعیت‌ها                                                      */
/* ==================================================================== */

export type OrderStatusCounts = Record<OrderStatusCountKey, number> & {
  /** تعداد کل سفارش‌ها (با احتساب وضعیت‌های ناشناس) */
  total: number;
  /** سفارش‌های در جریان: در انتظار پرداخت + پرداخت‌شده + ارسال‌شده */
  inProgress: number;
};

/** یک شمارنده‌ی صفر برای همه‌ی وضعیت‌ها */
export function emptyOrderStatusCounts(): OrderStatusCounts {
  return {
    pending: 0,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    unknown: 0,
    total: 0,
    inProgress: 0,
  };
}

/** کوچک‌ترین شکلِ سفارشی که برای شمارش لازم است */
export interface StatusBearing {
  status?: unknown;
}

/**
 * شمارشِ سفارش‌ها بر اساس وضعیتِ واقعیِ هر رکورد.
 *
 * نکته: وضعیتِ ناشناس در سطلِ `unknown` می‌رود و **هرگز** به `delivered` یا
 * `cancelled` اضافه نمی‌شود؛ بنابراین لغو‌شده یا در انتظار پرداخت نمی‌تواند
 * «تحویل شده» دیده شود.
 */
export function countOrdersByStatus<T extends StatusBearing>(
  orders: readonly T[] | null | undefined,
): OrderStatusCounts {
  const counts = emptyOrderStatusCounts();

  for (const order of orders ?? []) {
    const status = order?.status;

    if (isOrderStatus(status)) {
      counts[status] += 1;
    } else {
      counts.unknown += 1;
    }
  }

  counts.total =
    counts.pending +
    counts.paid +
    counts.shipped +
    counts.delivered +
    counts.cancelled +
    counts.unknown;
  counts.inProgress = counts.pending + counts.paid + counts.shipped;

  return counts;
}

/* ==================================================================== */
/* اقدام‌های مجاز روی سفارش                                            */
/* ==================================================================== */

/** کوچک‌ترین شکلِ سفارشی که برای تصمیمِ پرداخت/لغو لازم است */
export interface PayableOrder {
  status?: unknown;
  finalPrice?: number | string | null;
  /** مبلغی که از کیف پول زوپینی کسر شده (تومان) */
  walletPayment?: number | string | null;
  /** مبلغی که از اعتبار باشگاه کسر شده (تومان) */
  clubCreditPayment?: number | string | null;
}

function toAmount(value: unknown): number {
  const numeric = Number(value ?? 0);

  return Number.isFinite(numeric) ? numeric : 0;
}

/**
 * مبلغی که باید با درگاه پرداخت شود (تومان).
 *
 * دقیقاً همان محاسبه‌ی سمت سرور است:
 * `finalPrice - (walletPayment + clubCreditPayment)`
 * (`payment-guard.service.ts` در بک‌اند هم همین را بررسی می‌کند؛ اگر کل مبلغ
 * با این اعتبارها پوشش داده شده باشد، سرور درخواست درگاه را رد می‌کند.)
 */
export function getOrderCardAmount(order: PayableOrder): number {
  const finalPrice = toAmount(order?.finalPrice);
  const externalPayment =
    toAmount(order?.walletPayment) + toAmount(order?.clubCreditPayment);

  return Math.max(0, finalPrice - externalPayment);
}

/**
 * آیا این سفارش امکان پرداخت با درگاه دارد؟
 *
 * فقط سفارش «در انتظار پرداخت» که هنوز مبلغی از آن با کیف پول یا اعتبار
 * باشگاه پوشش داده نشده باشد — همان شرطی که سرور در
 * `PaymentGuardService.ensureOrderPayable` اعمال می‌کند.
 */
export function canPayOrderOnline(order: PayableOrder): boolean {
  return order?.status === 'pending' && getOrderCardAmount(order) > 0;
}

/**
 * آیا مشتری می‌تواند این سفارش را لغو کند؟
 *
 * سرور فقط سفارشِ `pending` را می‌پذیرد
 * (`OrdersService.cancelOrder`: «فقط سفارشات در انتظار قابل لغو هستند»).
 * نمایشِ دکمه برای `paid` یعنی دکمه‌ای که همیشه با خطا مواجه می‌شود.
 */
export function canCancelOrder(order: StatusBearing): boolean {
  return order?.status === 'pending';
}

/**
 * آیا سفارش فقط منتظر تأییدِ اعتبارهاست (کیف پول/باشگاه)؟
 *
 * در این حالت درگاه لازم نیست و باید دکمه‌ی «تأیید با اعتبارها» نشان داده
 * شود — همان شرطِ `confirmOrderFromWallet` در بک‌اند.
 */
export function needsWalletConfirmation(order: PayableOrder): boolean {
  if (order?.status !== 'pending') return false;

  const finalPrice = toAmount(order?.finalPrice);

  if (finalPrice <= 0) return false;

  const externalPayment =
    toAmount(order?.walletPayment) + toAmount(order?.clubCreditPayment);

  return externalPayment > 0 && externalPayment >= finalPrice;
}

/** گام بعدیِ پیشنهادی برای مشتری (برای نمایش در کارت سفارش) */
export function nextActionForOrder(order: PayableOrder): string | null {
  if (canPayOrderOnline(order)) return 'پرداخت سفارش';
  if (needsWalletConfirmation(order)) return 'تأیید با اعتبارها';

  return getOrderStatusMeta(order?.status).nextAction;
}

/* ==================================================================== */
/* خلاصه‌ی داشبورد                                                      */
/* ==================================================================== */

/** خلاصه‌ای که کارت‌های بالای داشبورد نمایش می‌دهند */
export interface DashboardOrderSummary {
  /** کل سفارش‌ها */
  total: number;
  /** در انتظار پرداخت */
  awaitingPayment: number;
  /** پرداخت شده (در حال آماده‌سازی) */
  processing: number;
  /** ارسال شده */
  shipped: number;
  /** تحویل شده — فقط وضعیتِ دقیقِ `delivered` */
  delivered: number;
  /** لغو شده — فقط وضعیتِ دقیقِ `cancelled` */
  cancelled: number;
  /** وضعیت‌های ناشناس (هرگز در «تحویل شده» شمرده نمی‌شوند) */
  unknown: number;
  /** در جریان: در انتظار پرداخت + پرداخت‌شده + ارسال‌شده */
  inProgress: number;
  /** در حال آماده‌سازی یا ارسال (پرداخت‌شده + ارسال‌شده) */
  inTransit: number;
}

/** خروجیِ خامِ اندپوینت `/orders` (فقط بخش‌هایی که استفاده می‌کنیم) */
export interface OrdersSummaryResponse {
  data?: readonly StatusBearing[] | null;
  stats?: Record<string, unknown> | null;
}

/** فقط عددهای صحیح و نامنفی را به‌عنوان شمارش می‌پذیریم */
function toCount(value: unknown): number {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric < 0) return 0;

  return Math.floor(numeric);
}

/**
 * خلاصه‌ی سفارش‌ها برای داشبورد.
 *
 * - اگر پاسخی نرسیده باشد (در حال بارگذاری) `null` برمی‌گردد تا کارت‌ها عددِ
 *   صفرِ گمراه‌کننده نشان ندهند؛
 * - آمارِ سرور (که کل سفارش‌های کاربر را می‌شمارد) مبناست؛
 * - اگر سرور آماری نفرستاد، همان سفارش‌های دریافت‌شده شمرده می‌شود؛
 * - `delivered` همیشه فقط تعداد سفارش‌هایی است که وضعیتشان دقیقاً
 *   `delivered` است؛ لغو‌شده یا در انتظار پرداخت هرگز در آن نمی‌آید.
 */
export function resolveOrderSummary(
  response?: OrdersSummaryResponse | null,
): DashboardOrderSummary | null {
  if (!response) return null;

  const stats = response.stats;
  const fromStats =
    stats && typeof stats === 'object'
      ? {
          total: toCount(stats.total),
          awaitingPayment: toCount(stats.awaitingPayment),
          processing: toCount(stats.processing),
          shipped: toCount(stats.shipped),
          delivered: toCount(stats.delivered),
          cancelled: toCount(stats.cancelled),
          unknown: toCount(stats.unknown),
          inProgress: toCount(stats.inProgress),
          inTransit: toCount(stats.processing) + toCount(stats.shipped),
        }
      : null;

  // اگر سرور شمارشِ صریح نفرستاد، از خودِ رکوردها می‌شماریم.
  if (!fromStats || fromStats.total === 0) {
    const counted = countOrdersByStatus(response.data);

    if (!fromStats || (counted.total > 0 && fromStats.total === 0)) {
      return {
        total: counted.total,
        awaitingPayment: counted.pending,
        processing: counted.paid,
        shipped: counted.shipped,
        delivered: counted.delivered,
        cancelled: counted.cancelled,
        unknown: counted.unknown,
        inProgress: counted.inProgress,
        inTransit: counted.paid + counted.shipped,
      };
    }
  }

  const summary = fromStats as DashboardOrderSummary;

  // سرور ممکن است `inProgress` قدیمی را فرستاده باشد؛ آن را با مجموعِ
  // وضعیت‌های در جریان هماهنگ می‌کنیم تا کارت‌ها با هم نخوانند.
  return {
    ...summary,
    inProgress: summary.awaitingPayment + summary.processing + summary.shipped,
  };
}
