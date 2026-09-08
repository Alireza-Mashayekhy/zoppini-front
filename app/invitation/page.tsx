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
    canonical: '/invitation',
  },
};

export default function Page() {
  return <InvitationPage />;
}
