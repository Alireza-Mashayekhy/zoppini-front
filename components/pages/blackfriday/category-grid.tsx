import Image from 'next/image';
import Link from 'next/link';

import {
  blackFridayCategoryHref,
  type StoreTopCategory,
} from '@/lib/blackfriday/campaign';

import styles from './category-grid.module.css';

/**
 * بخش چهارم — کاشی‌های دسته‌بندی اصلی فروشگاه.
 *
 * این کاشی‌ها همان هشت دسته‌بندی ریشه‌ایِ ناوبری فروشگاه هستند (منبع
 * حقیقت). تصویرها از خودِ دسته‌بندی‌های فروشگاه می‌آیند و لینک‌ها به
 * مسیر واقعی آرشیو دسته می‌روند. دستهٔ کمپین و زیردسته‌هایش در این
 * بخش نمایش داده نمی‌شوند؛ کمپین صرفاً برای شناسایی محصولات ۷۰٪باقی می‌شود.
 */
export function CategoryGrid({
  categories,
}: {
  categories: StoreTopCategory[];
}) {
  return (
    <section
      className={styles.section}
      id="categories"
      aria-labelledby="categories-heading"
    >
      <div className={styles.inner}>
        <h2 id="categories-heading">خرید بر اساس دسته‌بندی</h2>
        <ul className={styles.grid}>
          {categories.map(category => (
            <li key={category.id}>
              <Link
                className={styles.card}
                href={blackFridayCategoryHref(category.slug)}
              >
                {category.image ? (
                  <Image
                    className={styles.image}
                    src={category.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 20vw, 50vw"
                  />
                ) : (
                  <span className={styles.fallback} aria-hidden="true" />
                )}
                <span className={styles.name}>{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
