import { SiteImageRecord } from '@/lib/home-images';

/** یک جایگاه تصویر در پنل مدیریت (همان رکورد ذخیره‌شده) */
export interface AdminSiteImageResponse extends SiteImageRecord {
  isActive: boolean;
  updatedAt: string | null;
}

/** بدنه‌ی ذخیره‌ی یک جایگاه (فایل‌ها جداگانه در FormData می‌روند) */
export interface UpdateSiteImageDto {
  /** تصویر دسکتاپ؛ بعد از اولین بار اختیاری است */
  desktop?: File | null;
  /** تصویر موبایل — اختیاری */
  mobile?: File | null;
  alt?: string;
  linkUrl?: string;
  isActive?: boolean;
  /** حذف تصویر موبایل و بازگشت به تصویر دسکتاپ */
  removeMobile?: boolean;
}
