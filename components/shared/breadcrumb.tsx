import Link from 'next/link';
import Script from 'next/script';

export default function Breadcrumb({
  items,
}: {
  items: { name: string; href: string }[];
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'خانه',
        item: 'https://zoppinico.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: items[1].name,
        item: items[1].href,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: items[2].name,
        item: items[2].href,
      },
    ],
  };

  return (
    <>
      <Script
        id="product-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
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
