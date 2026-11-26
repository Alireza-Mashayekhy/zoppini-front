import Image from 'next/image';
import Link from 'next/link';

import {
  blackFridayCategoryHref,
  type BlackFridaySubcategory,
} from '@/lib/blackfriday/campaign';

import styles from './category-grid.module.css';

/**
 * بخش چهارم — کاشی‌های «خرید بر اساس دسته‌بندی».
 *
 * این بخش فقط پنج زیردستهٔ کمپین را نشان می‌دهد (پالتو، کت تک، شلوار،
 * پیراهن کژوال، پیراهن کلاسیک) به ترتیبِ بصریِ تاییدشده. تصویرِ هر کارت
 * همان تصویرِ تاییدشدهٔ کمپین است که قبلاً به آن دسته نگاشت شده بود و
 * نگاشت تصویر→دسته دست‌نخورده می‌ماند. لینک هر کارت به صفحهٔ همان
 * زیردسته زیر دستهٔ «بلک‌فرایدی» می‌رود (نه به دسته‌ای هم‌نام در سطح
 * بالای فروشگاه). این بخش از فیلترهای محصول جدا است.
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
