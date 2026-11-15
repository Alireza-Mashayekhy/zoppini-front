import { Metadata } from 'next';

import CatalogViewer from '@/components/pages/digital-catalog/catalog-viewer';
import { buildPageMetadata } from '@/lib/seo';
import { getCatalogPages } from '@/services/features/catalog/server.api';

const pageMetadata: Metadata = {
  // قبلاً عنوان و توضیحِ صفحه‌ی اصلی اینجا تکرار شده بود (و در رکوردِ پیش‌فرض
  // پنل سئو هم همین متن‌ها ذخیره شده است)؛ مقدار اختصاصیِ این صفحه:
  title: 'کاتالوگ دیجیتال زوپینی',
  description:
    'کاتالوگ دیجیتال زوپینی را ورق بزنید و مجموعه‌ی پوشاک مردانه — کت‌وشلوار، کت تک، پیراهن، شلوار و اکسسوری — را در یک نگاه ببینید.',
  alternates: {
    canonical: 'https://zoppinico.com/digital-catalog',
  },
};

/**
 * متای این صفحه: اگر مدیر سئو در پنل مقداری ثبت کرده باشد، همان مقدار
 * جایگزین متادیتای پیش‌فرض بالا می‌شود.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/digital-catalog', pageMetadata);
}

export default async function CatalogPage() {
  const catalogPages = await getCatalogPages();

  return <CatalogViewer pages={catalogPages?.data} />;
}
