import { Metadata } from 'next';

import B2bSalePage from '@/components/pages/b2b-sale/b2b-sale-page';
import { buildPageMetadata } from '@/lib/seo';

const pageMetadata: Metadata = {
  title: 'پوشاک و هدایای سازمانی زوپینی',
  description:
    'کارت هدیه سازمانی، تأمین پوشاک کارکنان و تولید اختصاصی زوپینی؛ درخواست مشاوره و قیمت متناسب با نیاز سازمان.',
  openGraph: {
    title: 'پوشاک و هدایای سازمانی زوپینی',
    description:
      'کارت هدیه سازمانی، تأمین پوشاک کارکنان و تولید اختصاصی زوپینی؛ درخواست مشاوره و قیمت متناسب با نیاز سازمان.',
    images: [{ url: '/b2b/hero.webp' }],
    type: 'website',
    siteName: 'زوپینی',
    locale: 'fa_IR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'پوشاک و هدایای سازمانی زوپینی',
    description:
      'کارت هدیه سازمانی، تأمین پوشاک کارکنان و تولید اختصاصی زوپینی؛ درخواست مشاوره و قیمت متناسب با نیاز سازمان.',
  },
  alternates: {
    canonical: 'https://zoppinico.com/b2bsale',
  },
};

/**
 * متای این صفحه: اگر مدیر سئو در پنل مقداری ثبت کرده باشد، همان مقدار
 * جایگزین متادیتای پیش‌فرض بالا می‌شود.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/b2bsale', pageMetadata);
}

export default function B2bSale() {
  return <B2bSalePage />;
}
