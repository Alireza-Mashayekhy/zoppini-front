import { api } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';
import { ApiListResponse, ApiSingleResponse } from '@/services/api/types';

import { AdminSiteImageResponse, UpdateSiteImageDto } from './types';

/** همه‌ی جایگاه‌هایی که مدیر تا حالا ذخیره کرده است */
export async function adminSiteImagesList() {
  const { data } = await api.get<ApiListResponse<AdminSiteImageResponse>>(
    endpoints.siteImages.adminList,
  );

  return data;
}

/**
 * ساخت یا به‌روزرسانی تصویر یک جایگاه.
 *
 * فایل‌ها با `multipart/form-data` فرستاده می‌شوند؛ فیلدهای خالی
 * (مثلاً تصویر موبایل که آپلود نشده) اصلاً ارسال نمی‌شوند.
 */
export async function updateSiteImage(slot: string, dto: UpdateSiteImageDto) {
  const formData = new FormData();

  if (dto.desktop) {
    formData.append('desktop', dto.desktop);
  }

  if (dto.mobile) {
    formData.append('mobile', dto.mobile);
  }

  if (dto.alt !== undefined) {
    formData.append('alt', dto.alt);
  }

  if (dto.linkUrl !== undefined) {
    formData.append('linkUrl', dto.linkUrl);
  }

  if (dto.isActive !== undefined) {
    formData.append('isActive', String(dto.isActive));
  }

  if (dto.removeMobile) {
    formData.append('removeMobile', 'true');
  }

  const { data } = await api.put<ApiSingleResponse<AdminSiteImageResponse>>(
    endpoints.siteImages.update(slot),
    formData,
  );

  return data;
}

/** حذف تصویرهای آپلودی جایگاه و بازگشت به تصویر پیش‌فرض سایت */
export async function resetSiteImage(slot: string) {
  const { data } = await api.delete(endpoints.siteImages.reset(slot));

  return data;
}
