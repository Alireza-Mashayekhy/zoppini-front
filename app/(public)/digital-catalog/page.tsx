import { Metadata } from 'next';

import CatalogViewer from '@/components/pages/digital-catalog/catalog-viewer';
import { getCatalogPages } from '@/services/features/catalog/server.api';

export const metadata: Metadata = {
  title: 'فروشگاه پوشاک مردانه - زوپینی',
  description:
    'فروشگاه آنلاین پوشاک مردانه زوپینی | خرید انواع کت شلوار مردانه، کت تک، پالتو، پیراهن و شلوار- خرید حضوری و اینترنتی | پرداخت در محل✓ امکان بازگشت کالا✓',
  alternates: {
    canonical: 'https://zoppinico.com/digital-catalog',
  },
};

export default async function CatalogPage() {
  const catalogPages = await getCatalogPages();

  return <CatalogViewer pages={catalogPages?.data} />;
}
