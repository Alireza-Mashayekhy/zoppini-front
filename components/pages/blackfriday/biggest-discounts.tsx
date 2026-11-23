import ProductCard from '@/components/shared/product-card';
import { toProductCardData } from '@/lib/blackfriday/products';
import type { ProductsResponse } from '@/services/features/products/type';

import styles from './biggest-discounts.module.css';

/**
 * بخش دوم — بیشترین تخفیف‌ها.
 *
 * شش محصول با بالاترین درصد تخفیفِ واقعی از کل دستهٔ کمپین (انتخاب در سرور،
 * از دادهٔ کاملی که `loadBlackFridayCatalog` خوانده است). روی موبایل، مثل
 * نسخهٔ تأییدشده، فقط چهار کارت اول دیده می‌شود و بقیه با CSS پنهان
 * می‌شوند تا چیدمان دو در دو یک صفحهٔ کامل بماند.
 */
export function BiggestDiscounts({
  products,
}: {
  products: ProductsResponse[];
}) {
  if (!products.length) return null;

  return (
    <section className={styles.section} aria-labelledby="discounts-heading">
      <div className={styles.inner}>
        <header className={styles.header}>
          <h2 id="discounts-heading">بیشترین تخفیف‌ها</h2>
          <p className={styles.aside}>تا ۷۰٪ تخفیف</p>
        </header>
        <ul className={styles.grid}>
          {products.map(product => (
            <li key={product.id}>
              <ProductCard {...toProductCardData(product)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
