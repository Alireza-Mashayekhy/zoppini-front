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

      <nav aria-label="مسیر" className="text-sm text-gray-500 px-6">
        <ol className="flex items-center gap-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              {i > 0 && <span>/</span>}
              {i === items.length - 1 ? (
                <span className="text-gray-900">{item.name}</span>
              ) : (
                <Link href={item.href} className="hover:text-primary">
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
