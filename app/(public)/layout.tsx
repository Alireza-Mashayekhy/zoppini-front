import Script from 'next/script';

import Footer from '@/components/layout/public/footer';
import Header from '@/components/layout/public/header';
import CompareBar from '@/components/shared/compare-bar';
import PromotionSuggestionPopup from '@/components/shared/promotion-suggestion-popup';
import SupportWidget from '@/components/shared/support-widget';

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'زوپینی',
            url: 'https://zoppinico.com',
            potentialAction: {
              '@type': 'SearchAction',
              target:
                'https://zoppinico.com/products?search={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      <SupportWidget />

      <Header />

      <div className="flex-1 pb-16 lg:pb-0">
        {children}
        <Footer />
      </div>

      {/* نوار شناور لیست مقایسه */}
      <CompareBar />

      {/*
        پاپ‌آپ پیشنهاد پیش از سبد.
        فقط در بخش عمومی سایت رندر می‌شود (نه پنل مدیریت) و اگر سبد واجد
        شرایط نباشد یا مشتری برای این وضعیت سبد پیشنهاد را رد کرده باشد،
        چیزی نمایش نمی‌دهد.
      */}
      <PromotionSuggestionPopup />
    </>
  );
}
