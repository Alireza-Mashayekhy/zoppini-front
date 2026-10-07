import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import EditorDemo from './editor-demo';

/**
 * صفحه‌ی آزمایش ادیتور یکپارچه.
 *
 * فقط در محیط توسعه در دسترس است (در بیلد پروداکشن ۴۰۴ می‌دهد) و به هیچ
 * API‌ای وصل نیست؛ برای دیدن امکانات ادیتور، خروجی HTML و قرارداد بلوک‌ها
 * بدون بالا آوردن بک‌اند استفاده می‌شود.
 */

export const metadata: Metadata = {
  title: 'آزمایشگاه ادیتور | زوپینی',
  robots: { index: false, follow: false },
};

export default function EditorDemoPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return <EditorDemo />;
}
