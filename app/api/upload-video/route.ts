import { NextRequest } from 'next/server';

import { proxyUpload } from '@/lib/upload-proxy';

/** آپلود ویدیو از پنل ادمین (ادیتور متن و بلوک گالری مدیا) */
export async function POST(request: NextRequest) {
  return proxyUpload(request);
}
