import { NextRequest } from 'next/server';

import { proxyUpload } from '@/lib/upload-proxy';

/** آپلود تصویر/صوت از پنل ادمین (ادیتور متن، گالری مدیا، کاور) */
export async function POST(request: NextRequest) {
  return proxyUpload(request);
}
