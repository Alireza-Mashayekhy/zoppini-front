import { publicFetch } from '@/services/api/server';
import { ApiListResponse } from '@/services/api/types';

import { CatalogPageResponse } from './types';

/**
 * جداسازیِ داده‌ی عمومی از داده‌ی شخصی (تشخیصِ هدر
 * `Cache-Control: private, no-cache, no-store` روی HTML):
 *
 * اندپوینت‌های این فایل در بک‌اند هیچ Guard یا احراز هویتی ندارند و پاسخ‌شان
 * به کاربر وابسته نیست؛ بنابراین با `publicFetch` خوانده می‌شوند: نه کوکیِ
 * کاربر فرستاده می‌شود و نه `cookies()` فراخوانی می‌شود. سیاستِ کش این
 * فراخوانی‌ها تغییر نکرده است.
 *
 * توجه: `publicFetch` مسیر را ایستا نمی‌کند — پیش‌فرضِ آن `cache: 'no-store'`
 * است و مسیر در هر درخواست دوباره رندر می‌شود. سودِ این جداسازی آن است که
 * هیچ داده‌ی وابسته به نشست وارد این درخواست‌ها نمی‌شود (و مسیر به‌خاطرِ
 * `cookies()` داینامیک نمی‌ماند)، نه اینکه خروجی کش شود.
 *
 * فراخوانی‌هایی که `next: { revalidate }` دارند (مثل featured/style) عمداً روی
 * `serverFetch` مانده‌اند؛ فعال کردنِ کش برای آن‌ها یعنی ISR و چون روی تازگیِ
 * قیمت/موجودی اثر دارد، نیازمند تصمیم جداگانه است (در گزارش مستند شده).
 */

export async function getCatalogPages() {
  return publicFetch<ApiListResponse<CatalogPageResponse>>('catalog/pages');
}
