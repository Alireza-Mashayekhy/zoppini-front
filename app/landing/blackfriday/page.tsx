import type { Metadata } from 'next';
import { connection } from 'next/server';

import Footer from '@/components/layout/public/footer';
import { BiggestDiscounts } from '@/components/pages/blackfriday/biggest-discounts';
import { CampaignScroll } from '@/components/pages/blackfriday/campaign-scroll';
import { CategoryGrid } from '@/components/pages/blackfriday/category-grid';
import { Countdown } from '@/components/pages/blackfriday/countdown';
import { Hero } from '@/components/pages/blackfriday/hero';
import { ProductCollection } from '@/components/pages/blackfriday/product-collection';
import { ScrollHint } from '@/components/pages/blackfriday/scroll-hint';
import CompareBar from '@/components/shared/compare-bar';
import { resolveBlackFridaySubcategories } from '@/lib/blackfriday/campaign';
import { loadBlackFridayCatalog } from '@/lib/blackfriday/catalog';
import { selectBiggestDiscounts } from '@/lib/blackfriday/products';
import { getAllCategories } from '@/services/features/categories/server.api';

import styles from './blackfriday.module.css';

/**
 * لندینگ بلک فرایدی — نسخهٔ تأییدشدهٔ کمپین، داخل پوستهٔ واقعی فروشگاه.
 *
 * چیدمان و ظاهر از نسخهٔ تأییدشدهٔ کمپین آمده‌اند؛ هدر/فوتر/ناوبری و همهٔ
 * داده‌ها از خود فروشگاه: محصولات از دستهٔ ۱۳۷ خوانده می‌شوند و کارت‌ها همان
 * کارت مشترک محصول هستند.
 */

export const metadata: Metadata = {
  title: 'BLACK FRIDAY | زوپینی',
  description:
    'بلک فرایدی زوپینی؛ تا ۷۰٪ تخفیف پوشاک مردانه. مهلت کمپین: ۸ آذر ۱۴۰۵.',
  alternates: { canonical: '/landing/blackfriday' },
  openGraph: {
    title: 'BLACK FRIDAY | زوپینی',
    description: 'بلک فرایدی زوپینی؛ تا ۷۰٪ تخفیف پوشاک مردانه.',
    url: '/landing/blackfriday',
    type: 'website',
    locale: 'fa_IR',
    images: [
      {
        url: '/campaign/blackfriday/hero-desktop.jpg',
        width: 2048,
        height: 1152,
        alt: 'بلک‌فرایدی زوپینی؛ پوشاک مردانهٔ کلاسیک',
      },
    ],
  },
};

export default async function BlackFridayPage() {
  /**
   * رندر در هر درخواست: زمان و موجودی/قیمت‌ها نباید در build یا کشِ CDN
   * قفل شوند. این همان الگوی صفحهٔ قبلیِ لندینگ است.
   */
  await connection();

  const [catalog, categoriesResponse] = await Promise.all([
    loadBlackFridayCatalog().catch(error => {
      console.error('Black Friday catalog request failed', error);
      return null;
    }),
    getAllCategories().catch(() => null),
  ]);

  const subcategories = resolveBlackFridaySubcategories(
    categoriesResponse?.data,
  );
  // شش محصول با بالاترین تخفیف واقعیِ کل دسته؛ انتخاب در هر درخواست تازه
  // می‌تواند عوض شود ولی HTMLِ سرور و hydration کلاینت یکی است.
  const biggestDiscounts = catalog
    ? selectBiggestDiscounts(catalog.products, 6)
    : [];

  return (
    <div className="flex-1 pb-[var(--zp-mobile-nav-h)] lg:pb-0">
      <main className={styles.campaign} dir="rtl">
        <CampaignScroll />
        <Hero />
        <BiggestDiscounts products={biggestDiscounts} />
        <Countdown />
        <CategoryGrid categories={subcategories} />
        <ProductCollection
          initialItems={catalog?.initialPage ?? []}
          initialPagination={catalog?.pagination ?? null}
          subcategories={subcategories}
          unavailable={catalog === null}
        />
        <ScrollHint />
      </main>
      <Footer />
      {/*
        نوار مقایسهٔ مشترک فروشگاه: کارت محصول دکمهٔ مقایسه دارد، پس مثل
        بقیهٔ صفحه‌ها نوار هم باید در دسترس باشد (لِی‌اوت این مسیر فقط هدر
        را می‌آورد).
      */}
      <CompareBar />
    </div>
  );
}
