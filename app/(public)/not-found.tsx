import NotFoundSection from '@/components/pages/not-found/not-found-section';

/**
 * ۴۰۴ داخل بخش عمومی سایت.
 * هدر و فوتر را لایهٔ `(public)` اضافه می‌کند، بنابراین اینجا فقط
 * محتوای صفحه رندر می‌شود تا هدر/فوتر دو بار تکرار نشوند.
 */
export default function NotFound() {
  return <NotFoundSection />;
}
