import Script from 'next/script';

import Footer from '@/components/layout/public/footer';
import Header from '@/components/layout/public/header';
import CompareBar from '@/components/shared/compare-bar';
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

      {children}

      <Footer />

      {/* نوار شناور لیست مقایسه */}
      <CompareBar />
    </>
  );
}
