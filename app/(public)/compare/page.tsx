import type { Metadata } from 'next';

import CompareView from '@/components/pages/products/compare-view';

export const metadata: Metadata = {
  title: 'مقایسه محصولات - زوپینی',
  description:
    'مقایسه مشخصات محصولات زوپینی؛ قیمت، رنگ، سایز و موجودی چند محصول را کنار هم ببینید.',
  /**
   * صفحه‌ی مقایسه برای هر کاربر متفاوت است و محتوای تکراری تولید می‌کند، پس
   * `noindex` می‌گیرد. اما عمداً در `robots.txt` مسدود نشده است:
   * ترکیبِ Disallow و noindex باعث می‌شود گوگل هرگز صفحه را نخزد، متای
   * noindex را نبیند و آدرسِ بدون محتوا می‌تواند در نتایج باقی بماند. با
   * اجازه‌ی خزش، خزنده متا را می‌خواند و صفحه تمیز از ایندکس خارج می‌شود.
   *
   * همین سیاست برای `/login` و `/sign-up` (app/(auth)/layout.tsx)،
   * `/dashboard` (app/(user)/layout.tsx)، `/admin` (app/(admin)/layout.tsx) و
   * `/checkout` (app/(public)/checkout/layout.tsx) هم برقرار است: آن‌ها
   * noindex دارند و در robots.txt مسدود نشده‌اند. در `robots.txt` فقط
   * `/api/` و `/_next/` مسدود شده‌اند، چون مسیرهای بدون HTML هستند و متایی
   * برای دیده شدن ندارند.
   */
  robots: { index: false, follow: true },
};

export default function ComparePage() {
  return <CompareView />;
}
