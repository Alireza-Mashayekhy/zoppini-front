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
    canonical: '/events',
  },
};

export default function EventsPage() {
  return (
    <div className="pt-[52px] pb-4 relative">
      <Image
        src="/invitation/desktop.webp"
        alt="desktop invitation"
        width={2560}
        height={2049}
        objectFit="cover"
        className="h-[calc(100vh-52px)] w-auto mx-auto hidden sm:block"
      />
      <Image
        src="/invitation/mobile.webp"
        alt="mobile invitation"
        width={2560}
        height={2049}
        objectFit="cover"
        className="w-full h-auto mx-auto sm:hidden"
      />
    </div>
  );
}
