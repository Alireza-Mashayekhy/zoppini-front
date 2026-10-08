/** متای ثبت‌شده برای یک صفحه از سایت */
export interface PageSeoResponse {
  id: number;
  /** مسیر صفحه، مثل `/about-us` */
  path: string;
  /** نام نمایشی صفحه در پنل مدیریت، مثل «درباره ما» */
  label: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  /** false یعنی noindex؛ صفحه در نتایج جستجو ایندکس نمی‌شود */
  indexable: boolean;
  /** false یعنی nofollow؛ لینک‌های صفحه دنبال نمی‌شوند */
  followable: boolean;
  /** مقصد ریدایرکت 301 دائمی؛ null یعنی بدون ریدایرکت */
  redirectTo: string | null;
  /** آیا URL در page-sitemap.xml منتشر شود؟ */
  includeInPageSitemap: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageSeoDto {
  path: string;
  label?: string;
  metaTitle?: string;
  metaDescription?: string;
  indexable?: boolean;
  followable?: boolean;
  redirectTo?: string | null;
  includeInPageSitemap?: boolean;
}

export type UpdatePageSeoDto = Partial<CreatePageSeoDto>;

/** یک ریدایرکت 301 ثبت‌شده در پنل سئو */
export interface SeoRedirectResponse {
  id: number;
  path: string;
  label: string | null;
  redirectTo: string;
}
