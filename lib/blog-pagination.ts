/**
 * سیاستِ صفحه‌بندیِ وبلاگ (canonical، عنوان و robots) به‌شکلِ خالص.
 *
 * چرا این ماژول جدا شده است:
 * - `/blog`، `/blog?page=2`، … هر کدام مجموعه‌ی متفاوتی از مقالات را در HTML
 *   اولیه دارند (تأییدشده روی سایت)، بنابراین صفحه‌بندی محتوای تکراری نیست؛
 * - با این حال canonicalِ همه‌ی صفحات به صفحه‌ی اول بود، یعنی صفحات ۲ به بعد
 *   هیچ‌وقت ایندکس نمی‌شدند؛
 * - تصمیمِ جدید: صفحات ۲ به بعد **self-canonical** و `index, follow` می‌شوند،
 *   و فقط حالت‌های نامعتبر (پارامترِ خراب، صفحه‌ی خارج از محدوده، جستجو)
 *   `noindex` می‌گیرند تا ایندکس نشوند.
 *
 * این ماژول هیچ وابستگی‌ای به React/Next ندارد تا قابل تست باشد.
 */

/** آدرس پایه‌ی canonical وبلاگ — فقط non-www و فقط https. */
export const BLOG_CANONICAL_BASE = 'https://zoppinico.com/blog';

/** تعداد مقالات در هر صفحه (بدون تغییر نسبت به رفتار فعلی). */
export const BLOG_PAGE_SIZE = 12;

/** عنوانِ صفحه‌ی اول. */
export const BLOG_TITLE = 'وبلاگ - زوپینی';

/**
 * تجزیه‌ی ایمنِ پارامترِ `page`.
 *
 * فقط اعداد صحیحِ مثبت پذیرفته می‌شوند؛ `0`، منفی، اعشاری، رشته‌ی غیرعددی،
 * آرایه و `undefined` همگی `null` برمی‌گردانند تا بعداً به‌عنوان «نامعتبر»
 * مدیریت شوند (و هرگز به‌صورت خودکار به صفحه‌ی ۱ تبدیل و ایندکس نشوند).
 */
export function parsePageParam(value: unknown): number | null {
  const raw = Array.isArray(value) ? value[0] : value;

  if (typeof raw === 'number') {
    return Number.isInteger(raw) && raw > 0 ? raw : null;
  }

  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();

  if (!/^\d+$/.test(trimmed)) return null;

  const parsed = Number(trimmed);

  return parsed > 0 ? parsed : null;
}

/** شماره صفحه را با ارقام فارسی برمی‌گرداند (مثل «۲»). */
export function persianPageNumber(page: number): string {
  return page.toLocaleString('fa-IR');
}

/**
 * عنوانِ اختصاصیِ هر صفحه.
 *
 * `baseTitle` عنوانِ صفحه‌ی اول است (پیش‌فرض یا مقداری که مدیر سئو در پنل
 * ثبت کرده). صفحاتِ بعدی پسوندِ شماره می‌گیرند تا عنوانِ هر صفحه یکتا باشد.
 */
export function blogPageTitle(page: number, baseTitle: string = BLOG_TITLE): string {
  if (page <= 1) return baseTitle;

  // قالبِ موردنظرِ صفحه‌بندی: «وبلاگ - صفحه ۲ - زوپینی»
  if (baseTitle === BLOG_TITLE) {
    return `وبلاگ - صفحه ${persianPageNumber(page)} - زوپینی`;
  }

  return `${baseTitle} - صفحه ${persianPageNumber(page)}`;
}

/**
 * ترکیبِ دستورِ robotsِ صفحه با تنظیمات پنل سئو.
 *
 * پنل فقط می‌تواند ایندکس/دنبال‌کردن را **خاموش** کند؛ هرگز نمی‌تواند صفحه‌ای
 * نامعتبر (مثل `?page=abc` یا صفحه‌ی خارج از محدوده) را که سیاستِ
 * صفحه‌بندی `noindex` کرده، دوباره ایندکس‌پذیر کند.
 */
export function resolveBlogRobots(
  panel: { indexable?: boolean | null; followable?: boolean | null } | null | undefined,
  pageRobots: { index: boolean; follow: boolean },
): { index: boolean; follow: boolean } {
  return {
    index: panel?.indexable === false ? false : pageRobots.index,
    follow: panel?.followable === false ? false : pageRobots.follow,
  };
}

export interface BlogPageSeoInput {
  /** مقدارِ خامِ پارامتر `page` (از searchParams). */
  page?: unknown;
  /** مقدارِ خامِ پارامتر `search`. */
  search?: string | null;
  /** تعداد کل صفحات بر اساس پاسخ API. */
  totalPages?: number | null;
}

export interface BlogPageSeo {
  /** شماره صفحه‌ای که واقعاً نمایش داده می‌شود (حداقل ۱). */
  requestedPage: number;
  /** آیا پارامترِ page معتبر و در محدوده است؟ */
  isValidPage: boolean;
  /** آیا این صفحه یک صفحه‌ی صفحه‌بندی‌شده (۲ به بعد) است؟ */
  isPaginated: boolean;
  /** آیا کاربر در حال جستجو است؟ */
  isSearch: boolean;
  canonical: string;
  title: string;
  robots: { index: boolean; follow: boolean };
}

/**
 * ساختِ canonical، عنوان و دستورِ robots برای یک وضعیتِ صفحه‌بندی.
 *
 * قواعد:
 * ۱. `/blog` و `/blog?page=1` → canonical `/blog`؛ عنوانِ پایه؛ index,follow.
 * ۲. صفحه‌ی ۲ به بعدِ معتبر → canonical خودش (`/blog?page=N`)؛ عنوانِ
 *    اختصاصی؛ index,follow.
 * ۳. پارامترِ نامعتبر (صفر، منفی، غیرعددی) یا صفحه‌ی فراتر از محدوده →
 *    canonical `/blog`؛ عنوانِ پایه؛ **noindex**,follow (جلوگیری از ایندکسِ
 *    وضعیت‌های خالی یا تکراری).
 * ۴. جستجو (`?search=…`) → canonical `/blog`؛ **noindex**,follow (نتایجِ
 *    جستجوی داخلی نباید ایندکس شوند).
 */
export function buildBlogPageSeo(input: BlogPageSeoInput = {}): BlogPageSeo {
  const rawPage = Array.isArray(input.page) ? input.page[0] : input.page;

  // نبودِ پارامتر (یا مقدارِ خالی) یعنی صفحه‌ی اولِ معتبر؛ اما هر مقدارِ
  // دیگری که نتوان به عددِ مثبت تبدیل شود، نامعتبر است (و نباید ایندکس شود).
  const hasPageParam =
    rawPage !== undefined &&
    rawPage !== null &&
    !(typeof rawPage === 'string' && rawPage.trim() === '');

  const parsedPage = parsePageParam(rawPage);
  const requestedPage = parsedPage ?? 1;

  const isSearch = Boolean(input.search?.trim());
  const totalPages =
    Number.isFinite(input.totalPages) && (input.totalPages as number) > 0
      ? Math.floor(input.totalPages as number)
      : 1;

  const isValidPage = hasPageParam
    ? parsedPage !== null && requestedPage <= totalPages
    : requestedPage <= totalPages;
  const isPaginated = isValidPage && !isSearch && requestedPage > 1;

  // نامعتبر یا جستجو: به صفحه‌ی اول اشاره می‌کنیم و ایندکس نمی‌شود.
  if (isSearch || !isValidPage) {
    return {
      requestedPage,
      isValidPage,
      isPaginated: false,
      isSearch,
      canonical: BLOG_CANONICAL_BASE,
      title: BLOG_TITLE,
      robots: { index: false, follow: true },
    };
  }

  return {
    requestedPage,
    isValidPage,
    isPaginated,
    isSearch: false,
    canonical: isPaginated
      ? `${BLOG_CANONICAL_BASE}?page=${requestedPage}`
      : BLOG_CANONICAL_BASE,
    title: blogPageTitle(requestedPage),
    robots: { index: true, follow: true },
  };
}
