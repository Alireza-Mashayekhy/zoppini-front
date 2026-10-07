import { toast } from 'sonner';

import { uploadBlogMedia } from '@/services/features/blog/api';

/**
 * آپلود فایل از داخل ادیتور.
 *
 * همان مسیر آپلود پنل ادمین استفاده می‌شود (`/api/upload` → بک‌اند) و
 * مسیر نسبی فایل برمی‌گردد تا در متن ذخیره شود؛ نمایش با `mediaUrl()`
 * کامل می‌شود.
 */

/** سقف حجم آپلود (هم‌راستا با بک‌اند) */
export const MAX_UPLOAD_SIZE = {
  image: 5 * 1024 * 1024,
  video: 50 * 1024 * 1024,
} as const;

const ACCEPTED_IMAGE = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];
const ACCEPTED_VIDEO = ['mp4', 'webm', 'ogv', 'm4v', 'mov'];

export type UploadKind = 'image' | 'video';

export interface UploadedFile {
  /** مسیر نسبی که در متن ذخیره می‌شود (مثل images/x.webp) */
  url: string;
  kind: UploadKind;
  filename: string;
}

/** نوع فایل بر اساس MIME (و در صورت نبود، پسوند نام فایل) */
export function detectKind(file: File): UploadKind | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (ACCEPTED_IMAGE.includes(extension)) return 'image';
  if (ACCEPTED_VIDEO.includes(extension)) return 'video';

  return null;
}

/** پیام خطای فارسی یا null وقتی فایل مجاز است */
export function validateFile(file: File): string | null {
  const kind = detectKind(file);

  if (!kind) {
    return `فرمت «${file.name}» پشتیبانی نمی‌شود (فقط عکس و فیلم)`;
  }

  if (file.size > MAX_UPLOAD_SIZE[kind]) {
    const limit = MAX_UPLOAD_SIZE[kind] / (1024 * 1024);
    return `حجم «${file.name}» بیشتر از ${limit}MB است`;
  }

  return null;
}

/**
 * آپلود یک فایل همراه با اعتبارسنجی.
 *
 * در صورت خطا، پیام فارسی با toast نمایش داده می‌شود و تابع `null`
 * برمی‌گرداند تا فراخوان فقط نتیجه‌ی موفق را بررسی کند.
 */
export async function uploadEditorFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadedFile | null> {
  const error = validateFile(file);

  if (error) {
    toast.error(error);
    return null;
  }

  const kind = detectKind(file) as UploadKind;

  try {
    const result = await uploadBlogMedia(file, kind, onProgress);

    return { url: result.url, kind, filename: result.filename };
  } catch {
    toast.error(`آپلود «${file.name}» ناموفق بود`);
    return null;
  }
}

/** آپلود چند فایل به‌ترتیب (برای گالری) */
export async function uploadEditorFiles(
  files: File[],
  onProgress?: (file: File, percent: number) => void,
): Promise<UploadedFile[]> {
  const uploaded: UploadedFile[] = [];

  for (const file of files) {
    const result = await uploadEditorFile(file, percent =>
      onProgress?.(file, percent),
    );

    if (result) uploaded.push(result);
  }

  return uploaded;
}

/** آیا آدرس یک فایل ویدیویی است؟ (برای تشخیص نوع از روی URL) */
export function isVideoUrl(url?: string | null): boolean {
  return !!url && /\.(mp4|webm|ogv|m4v|mov)(\?.*)?$/i.test(url);
}
