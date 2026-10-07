import { Metadata } from 'next';

import CatalogViewer from '@/components/pages/digital-catalog/catalog-viewer';
import { buildPageMetadata } from '@/lib/seo';
import { getCatalogPages } from '@/services/features/catalog/server.api';

const pageMetadata: Metadata = {
  title: 'فروشگاه پوشاک مردانه - زوپینی',
  description:
    'فروشگاه آنلاین پوشاک مردانه زوپینی | خرید انواع کت شلوار مردانه، کت تک، پالتو، پیراهن و شلوار- خرید حضوری و اینترنتی | پرداخت در محل✓ امکان بازگشت کالا✓',
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
