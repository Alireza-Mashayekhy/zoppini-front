import './not-found.css';

import Image from 'next/image';
import Link from 'next/link';

/**
 * محتوای صفحهٔ ۴۰۴.
 * این کامپوننت فقط بخش اصلی را رندر می‌کند؛ هدر و فوتر توسط لایهٔ
 * هر مسیر (یا خود `app/not-found.tsx`) تامین می‌شود.
 */
export default function NotFoundSection() {
  return (
    <main className="not-found-page">
      <section
        className="not-found-page__content"
        aria-labelledby="not-found-title"
      >
        <Image
          className="not-found-page__image"
          src="/404/editorial.webp"
          alt="کت آبی‌خاکستری و کت بژ زوپینی روی رگال، با یک چوب‌لباسی خالی میان آن‌ها"
          width={1200}
          height={800}
          priority
        />

        <h1 id="not-found-title" className="not-found-page__title">
          این صفحه را پیدا نکردیم
        </h1>

        <p className="not-found-page__text">
          ممکن است آدرس آن تغییر کرده باشد یا دیگر در دسترس نباشد. محصولات
          زوپینی را از اینجا ببینید.
        </p>

        <div className="not-found-page__actions">
          <Link
            className="not-found-page__button not-found-page__button--primary"
            href="/products"
          >
            مشاهده محصولات
          </Link>

          <Link className="not-found-page__button" href="/">
            رفتن به صفحهٔ اصلی
          </Link>
        </div>
      </section>
    </main>
  );
}
