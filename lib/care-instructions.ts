import type { CareInstructionsTitle } from '@/services/features/products/type';

/** Default also covers products created before the title option existed. */
export function careInstructionsLabel(title?: CareInstructionsTitle | null) {
  return title === 'maintenance' ? 'نحوه نگهداری' : 'نحوه شستشو';
}

/**
 * آیا راهنمای شست‌وشوی «راهنمای محصول» محتوای قابل نمایش دارد؟
 * راهنمایی که فقط نام دارد و دستور یا نکته‌ای ندارد، محتوایی برای نمایش نیست.
 */
export function hasCareGuideContent<
  T extends { notes?: string | null; instructions: unknown[] },
>(careGuide: T | null | undefined): careGuide is T {
  return Boolean(
    careGuide && (careGuide.instructions.length > 0 || careGuide.notes?.trim()),
  );
}

/**
 * منبع نهایی «نحوه شستشو» برای نمایش در فرانت.
 *
 * اولویت با راهنمای ثبت‌شده در «راهنمای محصول» است. متن ویرایش محصول
 * (`careInstructionsHtml`) فقط وقتی نمایش داده می‌شود که این راهنما برای
 * محصول محتوایی نداشته باشد؛ هیچ‌وقت هر دو با هم نمایش داده نمی‌شوند.
 */
export function resolveCareSource<
  T extends { notes?: string | null; instructions: unknown[] },
>(
  careGuide: T | null | undefined,
  careInstructionsHtml?: string | null,
): { careGuide: T | null; careInstructionsHtml: string | null } {
  if (hasCareGuideContent(careGuide)) {
    return { careGuide, careInstructionsHtml: null };
  }

  return {
    careGuide: null,
    careInstructionsHtml: careInstructionsHtml || null,
  };
}
