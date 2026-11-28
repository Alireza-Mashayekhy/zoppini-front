import Image from 'next/image';
import Link from 'next/link';

import {
  blackFridayCategoryHref,
  type BlackFridaySubcategory,
  type StoreTopCategory,
} from '@/lib/blackfriday/campaign';

import styles from './category-grid.module.css';

/** Desktop uses the five curated campaign tiles; mobile retains its existing list. */
export function CategoryGrid({
  categories,
  desktopCategories,
}: {
  categories: StoreTopCategory[];
  desktopCategories: BlackFridaySubcategory[];
}) {
  return (
    <section
      className={styles.section}
      id="categories"
      aria-labelledby="categories-heading"
    >
      <div className={styles.inner}>
        <h2 id="categories-heading">خرید بر اساس دسته‌بندی</h2>
        <ul className={`${styles.grid} ${styles.mobileGrid}`}>
          {categories.map((category, index) => {
            // کارت اول در موبایل تمام‌عرض است؛ تصویرش کامل (contain) روی
            // نسخهٔ محوِ همان تصویر می‌نشیند تا تصاویر مربعیِ CMS بریده نشوند.
            const featured = index === 0;
            const sizes = featured ? '100vw' : '50vw';
            return (
              <li key={category.id}>
                <Link
                  className={styles.card}
                  href={blackFridayCategoryHref(category.slug)}
                >
                  {category.image ? (
                    <>
                      {featured && (
                        <Image
                          className={styles.backdrop}
                          src={category.image}
                          alt=""
                          aria-hidden="true"
                          fill
                          sizes={sizes}
                        />
                      )}
                      <Image
                        className={
                          featured
                            ? `${styles.image} ${styles.imageFeatured}`
                            : styles.image
                        }
                        src={category.image}
                        alt=""
                        fill
                        sizes={sizes}
                      />
                    </>
                  ) : (
                    <span className={styles.fallback} aria-hidden="true" />
                  )}
                  <span className={styles.name}>{category.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <ul className={`${styles.grid} ${styles.desktopGrid}`}>
          {desktopCategories.map(category => (
            <li key={category.id}>
              <Link
                className={styles.card}
                href={blackFridayCategoryHref(category.slug)}
              >
                <Image
                  className={styles.image}
                  src={category.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 20vw, 50vw"
                />
                <span className={styles.name}>{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
