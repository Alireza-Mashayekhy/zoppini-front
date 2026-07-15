// app/branches/page.tsx
import { Metadata } from 'next';

import BranchesContent from '@/components/pages/branches/branches-content';

export const metadata: Metadata = {
  title: 'شعب - زوپینی',
  description:
    'آدرس دفتر مرکزی : تهران، خیابان فردوسی, خیابان منوچهری, خیابان ارباب جمشیدپلاک 17, واحد 29, طبقه 2،',
  openGraph: {
    title: 'ضعب زوپینی',
    description: 'آدرس و شماره تماس فروشگاه زوپینی - شعبه تهران و کرمان',
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
    canonical: '/branches',
  },
};

export default function BranchesPage() {
  return <BranchesContent />;
}
