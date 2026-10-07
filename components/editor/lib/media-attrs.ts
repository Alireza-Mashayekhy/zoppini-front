/**
 * قرارداد مشترک نودهای رسانه (تصویر و ویدیو).
 *
 * این فایل هم توسط تعریف نود (برای ساخت/خواندن HTML) و هم توسط نمای
 * React (برای پیش‌نمایش و ویرایش) استفاده می‌شود؛ پس هیچ‌کدام از آن دو
 * نباید به دیگری import داشته باشند تا چرخه‌ی وابستگی ساخته نشود.
 */

/** چینش بلوک رسانه در مقاله */
export type MediaAlign = 'start' | 'center' | 'end';

export const MEDIA_ALIGNMENTS: MediaAlign[] = ['start', 'center', 'end'];

/** عرض‌های آماده (درصد) برای تصویر و ویدیو */
export const MEDIA_WIDTH_PRESETS = [25, 33, 50, 66, 75, 100] as const;

/** مقدار مشترک یک نود رسانه */
export interface MediaNodeAttrs {
  src: string;
  poster?: string;
  alt?: string;
  title?: string;
  caption?: string;
  width?: number | null;
  align?: MediaAlign;
  href?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

/** خواندن عنصر رسانه: هم از تگ تنها و هم از داخل `<figure>` */
export function readMediaElement(
  element: HTMLElement,
  tagName: 'img' | 'video',
): HTMLElement | null {
  if (element.tagName.toUpperCase() === tagName.toUpperCase()) return element;
  return element.querySelector(tagName);
}

/** خواندن عرض درصدی از استایل */
export function readMediaWidth(element: HTMLElement): number | null {
  const style = element.getAttribute('style') ?? '';
  const match = /width\s*:\s*(\d+(?:\.\d+)?)%/.exec(style);

  return match ? Math.round(Number(match[1])) : null;
}

/** خواندن چینش از کلاس */
export function readMediaAlign(element: HTMLElement): MediaAlign {
  const fromClass = /is-align-(start|center|end)/.exec(element.className ?? '');

  if (fromClass) return fromClass[1] as MediaAlign;

  return 'center';
}

/** محدود کردن درصد عرض به بازه‌ی مجاز */
export function clampWidth(value: number): number {
  return Math.min(100, Math.max(10, Math.round(value)));
}
