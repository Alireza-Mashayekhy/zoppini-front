import Link from 'next/link';

import { buildBreadcrumbJsonLd } from '@/lib/jsonld/breadcrumb';

export default function Breadcrumb({
  items,
}: {
  items: { name: string; href: string }[];
}) {
  // آدرس‌های JSON-LD باید مطلق باشند؛ ساختِ آن‌ها به تابع خالص منتقل شده است.
  const schema = buildBreadcrumbJsonLd(items);

  return (
    <>
      {/*
        تگ معمولی (نه next/script) تا JSON-LD در HTML اولیه‌ی سرور باشد و برای
        خزنده بدون اجرای JavaScript هم در دسترس باشد.
      */}
      {schema ? (
        <script
          id="product-breadcrumb-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ) : null}

      {/*
        هدر سایت `fixed` با ارتفاع 52px است؛ مسیر راهنما باید از زیر کل هدر
        (شامل نوارهای چسبان) بیرون بیاید، بنابراین خودش همان فاصلهٔ بالا را
        می‌گیرد. والدهای صفحه آن را با overflow نمی‌برند و لایهٔ آن از هدر
        پایین‌تر است؛ در نتیجه متن نه پنهان می‌شود و نه زیر هدر می‌افتد.
      */}
      <nav
        aria-label="مسیر"
        className="relative z-0 w-full max-w-full px-4 pb-2 pt-[calc(3.25rem+0.5rem)] text-xs text-gray-500 sm:px-6 sm:text-sm"
      >
        <ol className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex min-w-0 max-w-full items-center gap-x-2"
            >
              {i > 0 && (
                <span aria-hidden="true" className="shrink-0">
                  /
                </span>
              )}
              {i === items.length - 1 ? (
                <span className="block min-w-0 break-words text-gray-900">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="block min-w-0 break-words hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/30"
                >
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
