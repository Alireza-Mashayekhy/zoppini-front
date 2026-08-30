import Script from 'next/script';

// components/pages/product/product-jsonld.tsx
export default function ProductJsonLd({ product }: { product: any }) {
  const price = product.variants?.[0]?.price || 0;
  const imageUrl = `${process.env.NEXT_PUBLIC_SITE_URL}${product.image || ''}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: imageUrl,
    description: product.description?.replace(/<[^>]+>/g, '').slice(0, 500),
    sku: product.productCode,
    brand: { '@type': 'Brand', name: 'زوپینی' },
    offers: {
      '@type': 'Offer',
      url: `https://zoppinico.com/product/${product.slug}`,
      priceCurrency: 'IRR',
      price: price,
      availability: product.variants?.length
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <Script
      id="product-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
