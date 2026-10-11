import type { Metadata } from 'next';

import Footer from '@/components/layout/public/footer';
import Header from '@/components/layout/public/header';
import NotFoundSection from '@/components/pages/not-found/not-found-section';

/**
 * نکته: خودِ Next.js برای صفحات not-found تگ `robots: noindex` را اضافه
 * می‌کند، بنابراین اینجا فقط عنوان صفحه را تنظیم می‌کنیم.
 */
export const metadata: Metadata = {
  title: 'صفحه پیدا نشد | زوپینی',
};

/**
 * صفحهٔ پیش‌فرض ۴۰۴ برای آدرس‌هایی که با هیچ مسیری مطابقت ندارند.
 * چون این فایل خارج از گروه `(public)` است، هدر و فوتر اصلی سایت
 * را خودش صدا می‌زند تا ظاهر صفحه با بقیهٔ سایت یکسان باشد.
 */
export default function NotFound() {
  return (
    <>
      <Header />

      <NotFoundSection />

      <Footer />
    </>
  );
}
