export const B2B_SERVICE_OPTIONS = [
  'کارت هدیه سازمانی',
  'تأمین پوشاک سازمانی',
  'تولید اختصاصی',
  'برای انتخاب نیاز به مشاوره دارم',
] as const;

export type B2bService = (typeof B2B_SERVICE_OPTIONS)[number];

/**
 * رویدادی که با کلیک روی لینک هر راهکار صادر می‌شود تا
 * فرم درخواست، نوع خدمت را از پیش انتخاب کند.
 */
export const B2B_SERVICE_SELECT_EVENT = 'b2b:select-service';
