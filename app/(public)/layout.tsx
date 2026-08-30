import Script from 'next/script';

import Footer from '@/components/layout/public/footer';
import Header from '@/components/layout/public/header';

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Script
        id="goftino-widget"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(){
              var i="7Y752F",
                  a=window,
                  d=document;

              function g(){
                var g=d.createElement("script"),
                    s="https://www.goftino.com/widget/"+i,
                    l=localStorage.getItem("goftino_"+i);

                g.async=!0;
                g.src=l?s+"?o="+l:s;
                d.getElementsByTagName("head")[0].appendChild(g);
              }

              "complete"===d.readyState
                ? g()
                : a.attachEvent
                  ? a.attachEvent("onload",g)
                  : a.addEventListener("load",g,!1);
            }();
          `,
        }}
      />

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

      <Header />

      {children}

      <Footer />
    </>
  );
}
