import { categoryDescriptionHtml } from '@/lib/category-description';

import styles from './category-description.module.css';

type Props = {
  /** نام دسته‌بندی؛ فقط برای برچسب دسترس‌پذیری بخش استفاده می‌شود */
  name: string;
  /** توضیحات خام دسته‌بندی از پنل (HTML ویرایشگر متن) */
  html?: string | null;
};

/**
 * بلوک توضیحات دسته‌بندی که پایین صفحه‌ی فهرست محصولات نمایش داده می‌شود.
 *
 * هر دو مسیر `/category/[slug]` و `/product-category/[slug]` از همین
 * کامپوننت استفاده می‌کنند تا متن و ظاهر توضیحات در هر دو صفحه یکی باشد.
 * اگر دسته‌بندی توضیح واقعی نداشته باشد، هیچ چیز (بدون فضای خالی) رندر نمی‌شود.
 */
export default function CategoryDescription({ name, html }: Props) {
  const content = categoryDescriptionHtml(html);
  if (!content) return null;

  return (
    <section className={styles.wrapper} aria-label={`توضیحات ${name}`}>
      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
}
