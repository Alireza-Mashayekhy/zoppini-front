/**
 * نرمال‌سازی کد کالا (SKU)
 *
 * همان کاری که بک‌اند هنگام Sync با راهکاران انجام می‌دهد:
 * - حذف فاصله‌های ابتدا و انتها
 * - تبدیل ارقام فارسی/عربی به لاتین
 *
 * با این کار «۱۲۳۴» و «1234» یک کد در نظر گرفته می‌شوند و
 * تشخیص «این کالا قبلاً به کدام محصول وصل شده» دقیق می‌شود.
 */
export function normalizeSku(value?: string | null): string {
  if (!value) {
    return '';
  }

  return value
    .trim()
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}
