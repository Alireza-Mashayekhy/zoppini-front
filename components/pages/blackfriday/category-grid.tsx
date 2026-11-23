import Image from 'next/image';
import Link from 'next/link';

import {
  blackFridayCategoryHref,
  type BlackFridaySubcategory,
} from '@/lib/blackfriday/campaign';

import styles from './category-grid.module.css';

/**
 * بخش چهارم — کاشی‌های دسته‌بندی کمپین.
 *
 * تصویرهای ادیتوریال تأییدشده همان‌هایی هستند که با سورس آمده‌اند؛ لینک‌ها
 * اما به مسیر واقعی دسته در فروشگاه می‌روند و اسلاگ/نام از پاسخ زندهٔ
 * `/categories` گرفته می‌شود. هیچ دسته‌ای در این صفحه ساخته نمی‌شود.
 */
export function CategoryGrid({
  categories,
}: {
  categories: BlackFridaySubcategory[];
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
