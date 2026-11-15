import { buildProductJsonLd, ProductJsonLdInput } from '@/lib/jsonld/product';

/**
 * داده‌ی ساختاریافته‌ی محصول (JSON-LD).
 *
 * دو تغییر نسبت به نسخه‌ی قبلی:
 * ۱. ساختار و محاسبات به تابع خالصِ `buildProductJsonLd` منتقل شده تا تست‌پذیر
 *    باشد و آدرس تصویر/محصول با ابزار مرکزیِ `mediaUrl()` ساخته شود (قبلاً
 *    رشته‌چسبانیِ دستی بود و بدون جداکننده، آدرس نامعتبر می‌ساخت).
 * ۲. به‌جای `next/script` از تگِ معمولیِ `<script>` استفاده شده تا JSON-LD
 *    در HTML اولیه‌ی سرور باشد و برای خزنده بدون اجرای JS هم در دسترس باشد.
 */
export default function ProductJsonLd({
  product,
}: {
  product?: ProductJsonLdInput | null;
}) {
  const schema = buildProductJsonLd(product);

  // داده ناقص است (بدون عنوان/اسلاگ): چیزی منتشر نمی‌کنیم تا JSON-LD نامعتبر
  // وارد صفحه نشود.
  if (!schema) return null;

  return (
    <script
      id="product-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
