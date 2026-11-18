import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { connection } from 'next/server';

import Footer from '@/components/layout/public/footer';

import styles from './blackfriday.module.css';
import { CategoryTeaser } from './category-teaser';
import { ComingSoonHero } from './coming-soon-hero';
import { ComingSoonWait } from './coming-soon-wait';
import { CampaignClock } from './countdown';

const vazir = localFont({
  src: './fonts/Vazir-Medium-FD-WOL.woff2',
  weight: '500',
  variable: '--font-bf-vazir',
  display: 'swap',
});

const cormorant = localFont({
  src: './fonts/cormorant-garamond-latin-500-normal.woff2',
  weight: '500',
  variable: '--font-bf-cormorant',
  display: 'swap',
});

const oswald = localFont({
  src: [
    { path: './fonts/oswald-latin-500-normal.woff2', weight: '500' },
    { path: './fonts/oswald-latin-700-normal.woff2', weight: '700' },
  ],
  variable: '--font-bf-oswald',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'BLACK FRIDAY | زوپینی',
  description:
    'آغاز کمپین بلک‌فرایدی زوپینی: یکم آذر ۱۴۰۵، ساعت ۰۰:۰۰ به وقت تهران.',
  alternates: { canonical: '/landing/blackfriday' },
};

async function getRequestTime() {
  // Use a fresh server clock for each render, not a build-time timestamp.
  await connection();
  return Date.now();
}

export default async function BlackFridayPage() {
  const serverNowMs = await getRequestTime();

  return (
    <div className="flex-1 pb-[var(--zp-mobile-nav-h)] lg:pb-0">
      <main
        className={`${styles.campaign} ${vazir.variable} ${cormorant.variable} ${oswald.variable}`}
        dir="rtl"
      >
        <CampaignClock key={serverNowMs} serverNowMs={serverNowMs}>
          <ComingSoonHero />
          <ComingSoonWait />
        </CampaignClock>
        <CategoryTeaser />
      </main>
      <Footer />
    </div>
  );
}
