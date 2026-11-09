import { DEFAULT_PRODUCT_SORT } from './product-sort';

export interface ProductListParamState {
  /** مرتب‌سازی انتخاب‌شده در منوی صفحه */
  sort: string;
  colorIds?: number[];
  sizeIds?: number[];
  /** فقط برای لینک «محصولات بیشتر»؛ اگر داده نشود پارامتر page دست نمی‌خورد */
  page?: number;
}

/**
 * ساخت query string لیست محصولات برای همگام‌سازی آدرس.
 *
 * از پارامترهای فعلی آدرس شروع می‌کنیم و فقط همان‌هایی را که این کامپوننت
 * مدیریت می‌کند (sort/colorIds/sizeIds) بازنویسی می‌کنیم؛ بقیه — مهم‌تر از همه
 * `search` — دست‌نخورده می‌مانند.
 *
 * پیش‌تر آدرس از صفر ساخته می‌شد و `search` در آن نبود؛ نتیجه این بود که بعد
 * از «مشاهده همه نتایج» جستجو چند لحظه نمایش داده می‌شد و بعد آدرس به
 * `/products?sort=createdAt:desc` می‌پرید و لیست کل محصولات می‌آمد.
 *
 * مقدار پیش‌فرض مرتب‌سازی در آدرس نوشته نمی‌شود تا آدرس ورودی (مثلاً
 * `/products?search=نیم زیپ`) بدون تغییر بماند.
 */
export function buildProductListQuery(
  currentQuery: string,
  state: ProductListParamState,
): string {
  const params = new URLSearchParams(currentQuery);

  if (state.sort && state.sort !== DEFAULT_PRODUCT_SORT) {
    params.set('sort', state.sort);
  } else {
    params.delete('sort');
  }

  if (state.colorIds?.length) {
    params.set('colorIds', state.colorIds.join(','));
  } else {
    params.delete('colorIds');
  }

  if (state.sizeIds?.length) {
    params.set('sizeIds', state.sizeIds.join(','));
  } else {
    params.delete('sizeIds');
  }

  if (state.page !== undefined) {
    if (state.page > 1) params.set('page', String(state.page));
    else params.delete('page');
  }

  return params.toString();
}

/**
 * query string لینک «محصولات بیشتر».
 *
 * از پارامترهایی که سرور به کامپوننت داده (`initialParams`) شروع می‌کنیم تا
 * `search`، دسته‌بندی و فیلترهای فعلی با لینک به صفحه‌ی بعد بروند.
 */
export function buildNextPageQuery(params: {
  page: number;
  search?: string;
  limit?: number;
  defaultLimit?: number;
  sort: string;
  categoryIds?: number[];
  colorIds?: number[];
  sizeIds?: number[];
}): string {
  const base = new URLSearchParams();

  if (params.search) base.set('search', params.search);
  if (params.limit && params.limit !== (params.defaultLimit ?? 10)) {
    base.set('limit', String(params.limit));
  }
  if (params.categoryIds?.length) {
    base.set('categoryIds', params.categoryIds.join(','));
  }

  return buildProductListQuery(base.toString(), params);
}

/**
 * مقایسه‌ی معنایی دو query string.
 *
 * `URLSearchParams` فاصله را `+` می‌نویسد ولی آدرس‌هایی که با
 * `encodeURIComponent` ساخته می‌شوند `%20` دارند؛ مقایسه‌ی رشته‌ای خام این دو
 * را متفاوت می‌بیند و باعث replace بی‌مورد (و پرش آدرس) می‌شود.
 */
export function productQueriesEqual(a: string, b: string): boolean {
  const normalize = (query: string) =>
    [...new URLSearchParams(query).entries()]
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join('&');

  return normalize(a) === normalize(b);
}
