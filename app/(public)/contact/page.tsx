// app/branches/page.tsx
import { Metadata } from 'next';

import ContactContent from '@/components/pages/contact/contact-content';

export const metadata: Metadata = {
  title: 'تماس - زوپینی',
  description:
    'آدرس دفتر مرکزی : تهران، خیابان فردوسی, خیابان منوچهری, خیابان ارباب جمشید, پلاک 17, واحد 29, طبقه 2،',
  openGraph: {
    title: 'تماس زوپینی',
    description:
      'آدرس دفتر مرکزی : تهران، خیابان فردوسی, خیابان منوچهری, خیابان ارباب جمشید, پلاک 17, واحد 29, طبقه 2،',
    images: [{ url: '/og-image.jpg' }],
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
    canonical: '/contact',
  },
};

export default function ContantPage() {
  return <ContactContent />;
}
