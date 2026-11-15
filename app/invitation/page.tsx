import { Metadata } from 'next';

import InvitationPage from '@/components/pages/invitation/content';

export const metadata: Metadata = {
  title: 'دعوتنامه - زوپینی',
  description: 'دعوتنامه زوپینی',

  openGraph: {
    title: 'دعوتنامه - زوپینی',
    description: 'دعوتنامه زوپینی',
    images: [{ url: '/logo/og-image.webp' }],
    type: 'website',
    siteName: 'زوپینی',
    locale: 'fa_IR',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'دعوتنامه - زوپینی',
    description: 'دعوتنامه زوپینی',
  },

  alternates: {
    // آدرس مطلق و canonical (non-www + https)؛ قبلاً نسبی بود و حل شدنِ آن
    // به `metadataBase` وابسته بود.
    canonical: 'https://zoppinico.com/invitation',
  },
};

export default function Page() {
  return <InvitationPage />;
}
