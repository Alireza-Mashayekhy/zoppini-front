import type { Metadata } from 'next';
import { connection } from 'next/server';

import Footer from '@/components/layout/public/footer';
import { BiggestDiscounts } from '@/components/pages/blackfriday/biggest-discounts';
import { BlackFridaySeo } from '@/components/pages/blackfriday/black-friday-seo';
import { CampaignScroll } from '@/components/pages/blackfriday/campaign-scroll';
import { CategoryGrid } from '@/components/pages/blackfriday/category-grid';
import { Countdown } from '@/components/pages/blackfriday/countdown';
import { ProductCollection } from '@/components/pages/blackfriday/product-collection';
import { ScrollHint } from '@/components/pages/blackfriday/scroll-hint';
import CompareBar from '@/components/shared/compare-bar';
import { resolveStoreTopCategories } from '@/lib/blackfriday/campaign';
import {
  loadBlackFridayCatalog,
  loadTwentyPercentProducts,
} from '@/lib/blackfriday/catalog';
import {
  pruneCategoriesForProducts,
} from '@/lib/blackfriday/filtering';
import {
  buildCategoryIndex,
  interleaveBalancedProducts,
  mergeUniqueProducts,
  productInStock,
  selectBiggestDiscounts,
} from '@/lib/blackfriday/products';
import { getAllCategories } from '@/services/features/categories/server.api';

import styles from './blackfriday.module.css';

/**
 * لندینگ بلک فرایدی — داخل پوستهٔ واقعی فروشگاه.
 *
 * هدر/فوتر/ناوبری و همهٔ داده‌ها از خود فروشگاه می‌آیند؛ محصولات از دستهٔ
 * بلک فرایدی (۷۰٪) و محصولات تخفیف‌دار ۲۰٪ خوانده می‌شوند و به‌صورت
 * متوازن درهم‌تنیده به فهرست می‌روند. کارت‌ها همان کارت مشترک محصول‌اند.
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
        url: '/campaign/blackfriday/og-blackfriday.jpg',
        width: 1200,
        height: 630,
        alt: 'پوستر بلک‌فرایدی زوپینی؛ تا ۷۰٪ تخفیف پوشاک مردانهٔ کلاسیک',
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

  const topCategories = resolveStoreTopCategories(categoriesResponse?.data);
  // شش محصول با بالاترین تخفیف واقعیِ کل دسته؛ انتخاب در هر درخواست تازه
  // می‌تواند عوض شود ولی HTMLِ سرور و hydration کلاینت یکی است.
  const biggestDiscounts = catalog
    ? selectBiggestDiscounts(catalog.products, 6)
    : [];

  // گروه ۲۰٪: محصولات تخفیف‌دار فروشگاه با تخفیف فعال ۲۰٪ که در دستهٔ
  // بلک فرایدی نیستند. اگر این خواندن ناموفق باشد، فهرست فقط با گروه ۷۰٪
  // ادامه پیدا می‌کند.
  const blackFridayIds = new Set(
    (catalog?.products ?? []).map(product => product.id),
  );
  const twentyPercentProducts = await loadTwentyPercentProducts(
    blackFridayIds,
  ).catch(error => {
    console.error('Black Friday 20% products request failed', error);
    return [];
  });

  // فهرست واجدِ نهایی: بدون تکرار، فقط موجود، و درهم‌تنیدهٔ متوازن
  // (دو محصول ۷۰٪ و دو محصول ۲۰٪ در هر یک از دو ردیف اول).
  const eligibleProducts = interleaveBalancedProducts(
    mergeUniqueProducts([catalog?.products ?? [], twentyPercentProducts]).filter(
      productInStock,
    ),
    blackFridayIds,
    buildCategoryIndex(categoriesResponse?.data),
  );

  // فقط دسته‌هایی که محصول واجد دارد (به‌همراه والدهایشان) به کلاینت
  // می‌روند تا درخت دسته‌بندی برای فیلتر کامل باشد ولی payload کوچک بماند.
  // هشت دسته‌بندی اصلیِ ناوبری مستقیم از همان پاسخ کامل می‌آیند و به
  // ProductCollection همان‌ها می‌رسند.
  const collectionCategories = pruneCategoriesForProducts(
    eligibleProducts,
    categoriesResponse?.data,
  );

  return (
    <div className="flex-1 pb-[var(--zp-mobile-nav-h)] lg:pb-0">
      <main className={styles.campaign} dir="rtl">
        <CampaignScroll />
        {/* h1 نامرئی برای ساختار صفحه/سئو (بنر هیرو حذف شده است) */}
        <h1 className={styles.visuallyHidden}>
          بلک‌فرایدی زوپینی؛ تا ۷۰٪ تخفیف پوشاک مردانهٔ کلاسیک
        </h1>
        {/* میان‌بر کیبورد برای رفتن مستقیم به فهرست محصولات */}
        <a className={styles.skipLink} href="#collection">
          پرش به فهرست محصولات
        </a>
        <BiggestDiscounts products={biggestDiscounts} />
        <Countdown />
        <CategoryGrid categories={topCategories} />
        <ProductCollection
          products={eligibleProducts}
          categories={collectionCategories}
          topCategories={topCategories}
          unavailable={catalog === null}
        />
        <BlackFridaySeo />
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
