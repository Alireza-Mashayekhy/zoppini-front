import { NextRequest, NextResponse } from 'next/server';

/**
 * پروکسی آپلود فایل به بک‌اند.
 *
 * ادیتور متن (nilfam-editor) و کامپوننت‌های آپلود، فایل‌ها را به همین
 * Route Handlerهای داخلی Next می‌فرستند؛ دلیلش دو چیز است:
 *  ۱) کوکی احراز هویت ادمین همان‌جا (same-origin) همراه درخواست می‌آید و
 *     بدون درگیر شدن با CORS به بک‌اند پاس داده می‌شود.
 *  ۲) ادیتور مسیر `/api/upload` را هاردکد کرده و انتظار `{ url }` دارد.
 */

const API_BASE =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000/api/';

const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_URL ?? '';

/** بر اساس نام فیلد فرم، endpoint مناسب بک‌اند انتخاب می‌شود */
const FIELD_TARGETS: { field: string; target: string }[] = [
  { field: 'images', target: 'admin/files/image' },
  { field: 'image', target: 'admin/files/image' },
  { field: 'videos', target: 'admin/files/video' },
  { field: 'video', target: 'admin/files/video' },
  { field: 'audios', target: 'admin/files/audio' },
  { field: 'audio', target: 'admin/files/audio' },
];

/** نام فایل نسبی که در دیتابیس ذخیره می‌شود را به URL کامل تبدیل می‌کند */
export function toAbsoluteFileUrl(filename: string): string {
  if (!filename) return '';
  if (/^https?:\/\//i.test(filename)) return filename;
  return `${IMAGE_BASE}${filename}`;
}

export async function proxyUpload(request: NextRequest) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { message: 'فرم آپلود نامعتبر است' },
      { status: 400 },
    );
  }

  const matched = FIELD_TARGETS.find(({ field }) => {
    const value = formData.get(field);
    return value instanceof File && value.size > 0;
  });

  if (!matched) {
    return NextResponse.json(
      { message: 'فایلی برای آپلود ارسال نشده است' },
      { status: 400 },
    );
  }

  const cookie = request.headers.get('cookie') ?? '';

  let backendResponse: Response;

  try {
    backendResponse = await fetch(`${API_BASE}${matched.target}`, {
      method: 'POST',
      headers: cookie ? { cookie } : undefined,
      body: formData,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { message: 'ارتباط با سرور برقرار نشد' },
      { status: 502 },
    );
  }

  const payload = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok) {
    return NextResponse.json(
      {
        message:
          payload?.message ??
          `خطا در آپلود فایل (${backendResponse.status})`,
      },
      { status: backendResponse.status },
    );
  }

  const data = payload?.data ?? payload ?? {};
  const filenames: string[] = data.filenames ?? (data.filename ? [data.filename] : []);

  return NextResponse.json({
    success: true,
    /** ادیتور فقط همین را می‌خواند */
    url: toAbsoluteFileUrl(filenames[0] ?? ''),
    /** مسیرهای نسبی برای ذخیره در دیتابیس */
    filenames,
    urls: filenames.map(toAbsoluteFileUrl),
    files: (data.files ?? []).map(
      (file: { filename: string; url: string; kind: string }) => ({
        filename: file.filename,
        url: toAbsoluteFileUrl(file.url ?? file.filename),
        kind: file.kind,
      }),
    ),
  });
}
