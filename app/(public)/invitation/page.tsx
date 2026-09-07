import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'دعوتنامه - زوپینی',
  description: 'دعوتنامه زوپینی',
  openGraph: {
    title: 'دعوتنامه - زوپینی',
    description: 'دعوتنامه زوپینی',
    images: [{ url: '/logo/og-image.jpg' }],
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

export default function InvitationPage() {
  return (
    <div className="pt-[52px] pb-4 relative">
      <Image
        src="/invitation/desktop.webp"
        alt="desktop invitation"
        width={2560}
        height={2049}
        objectFit="cover"
        loading="eager"
        className="h-[calc(100vh-52px)] w-auto mx-auto hidden sm:block"
      />
      <Image
        src="/invitation/mobile.webp"
        alt="mobile invitation"
        width={2560}
        height={2049}
        objectFit="cover"
        loading="eager"
        className="w-full h-auto mx-auto sm:hidden"
      />
    </div>
  );
}
