// app/branches/page.tsx
import { Metadata } from 'next';

import ContactContent from '@/components/pages/contact/contact-content';
import { buildPageMetadata } from '@/lib/seo';

const pageMetadata: Metadata = {
  title: 'تماس - زوپینی',
  description:
    'آدرس دفتر مرکزی : تهران، خیابان فردوسی, خیابان منوچهری, خیابان ارباب جمشید, پلاک 17, واحد 29, طبقه 2،',
  openGraph: {
    title: 'تماس زوپینی',
    description:
      'آدرس دفتر مرکزی : تهران، خیابان فردوسی, خیابان منوچهری, خیابان ارباب جمشید, پلاک 17, واحد 29, طبقه 2،',
    images: [{ url: '/logo/og-image.webp' }],
    type: 'website',
    siteName: 'زوپینی',
    locale: 'fa_IR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'شعب زوپینی',
    description: 'آدرس و شماره تماس فروشگاه زوپینی',
  },
  alternates: {
    canonical: 'https://zoppinico.com/contact',
  },
};

/**
 * متای این صفحه: اگر مدیر سئو در پنل مقداری ثبت کرده باشد، همان مقدار
 * جایگزین متادیتای پیش‌فرض بالا می‌شود.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata('/contact', pageMetadata);
}

export default function ContantPage() {
  return <ContactContent />;
}
