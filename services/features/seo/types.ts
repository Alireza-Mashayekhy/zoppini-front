/** متای ثبت‌شده برای یک صفحه از سایت */
export interface PageSeoResponse {
  id: number;
  /** مسیر صفحه، مثل `/about-us` */
  path: string;
  /** نام نمایشی صفحه در پنل مدیریت، مثل «درباره ما» */
  label: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageSeoDto {
  path: string;
  label?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export type UpdatePageSeoDto = Partial<CreatePageSeoDto>;
