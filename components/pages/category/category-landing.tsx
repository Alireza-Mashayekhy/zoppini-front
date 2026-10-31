import Link from 'next/link';

import ProductCard from '@/components/shared/product-card';
import CategoryViewTracker from '@/components/shared/category-view-tracker';
import type { CategoriesResponse } from '@/services/features/categories/types';
import type { ProductsResponse } from '@/services/features/products/type';

import styles from './category-landing.module.css';

type Child = CategoriesResponse & { products: ProductsResponse[] };

type Props = {
  category: CategoriesResponse;
  ancestors: CategoriesResponse[];
  subcategories: Child[];
  directProducts: ProductsResponse[];
  seoHtml: string;
};

function ProductSection({
  title,
  href,
  products,
  id,
}: {
  title: string;
  href: string;
  products: ProductsResponse[];
  id: string;
}) {
  if (!products.length) return null;
  return (
    <section className={styles.section} aria-labelledby={id}>
      <div className={styles.sectionHeading}>
        <h2 id={id}>{title}</h2>
        <Link href={href}>مشاهده همه</Link>
      </div>
      <div className={styles.products} tabIndex={0} aria-label={title}>
        {products.map(product => (
          <ProductCard
            key={product.id}
            id={product.id}
            image={product.image}
            title={product.title}
            price={product.variants?.[0]?.price || 0}
            slug={product.slug}
            discount={product.discount}
          />
        ))}
      </div>
    </section>
  );
}

export default function CategoryLanding({
  category,
  ancestors,
  subcategories,
  directProducts,
  seoHtml,
}: Props) {
  const listHref = `/product-category/${category.slug}`;
  return (
    <main className={styles.page} dir="rtl">
      <CategoryViewTracker id={category.id} />
      <div className={styles.container}>
        <nav className={styles.breadcrumbs} aria-label="مسیر صفحه">
          <ol>
            <li>
              <Link href="/">خانه</Link>
            </li>
            {ancestors.map(parent => (
              <li key={parent.id}>
                <Link href={`/category/${parent.slug}`}>{parent.name}</Link>
              </li>
            ))}
            <li aria-current="page">{category.name}</li>
          </ol>
        </nav>
        <header className={styles.header}>
          <h1>{category.name}</h1>
          <Link href={listHref} className={styles.allProducts}>
            مشاهده همه محصولات
          </Link>
        </header>
        <nav
          className={styles.subcategories}
          aria-label={`زیر دسته‌های ${category.name}`}
        >
          {subcategories.map(child => (
            <Link key={child.id} href={`/product-category/${child.slug}`}>
              {child.name}
            </Link>
          ))}
        </nav>
        <ProductSection
          id={`category-${category.id}-direct`}
          title={`محصولات ${category.name}`}
          href={listHref}
          products={directProducts}
        />
        {subcategories.map(child => (
          <ProductSection
            key={child.id}
            id={`category-${child.id}-products`}
            title={child.name}
            href={`/product-category/${child.slug}`}
            products={child.products}
          />
        ))}
        {seoHtml && (
          <section
            className={styles.seo}
            aria-label={`توضیحات ${category.name}`}
            dangerouslySetInnerHTML={{ __html: seoHtml }}
          />
        )}
      </div>
    </main>
  );
}
