import { PromotionSuggestionView } from '@/services/features/promotions/types';

type SuggestionAction = PromotionSuggestionView['action'];

export interface SuggestionButton {
  /** آیا با این دکمه کالایی به سبد اضافه می‌شود */
  addsItem: boolean;
  /** آیا کالای افزوده‌شده رایگان است */
  free: boolean;
  label: string;
}

/**
 * تصمیم‌گیری دکمهٔ اصلی پاپ‌آپ از روی `action` سرور.
 *
 * قانون غیرقابل‌مذاکره: فقط `add_free_reward` اجازهٔ افزودن کالای رایگان
 * دارد. کالای پولی همیشه از مسیر معمولی سبد اضافه می‌شود؛ اگر اشتباهاً از
 * endpoint پاداش استفاده شود، کالای پولی به‌عنوان «هدیه» با مبلغ صفر ثبت
 * می‌شود و فروشگاه ضرر می‌کند.
 */
export function resolveSuggestionButton(
  suggestion: Pick<
    PromotionSuggestionView,
    'action' | 'requiresSelection' | 'acceptLabel'
  >,
): SuggestionButton {
  const customLabel = suggestion.acceptLabel?.trim();

  switch (suggestion.action) {
    case 'add_paid_item':
      return {
        addsItem: true,
        free: false,
        label: customLabel || 'افزودن به سبد',
      };

    case 'open_cart':
      return {
        addsItem: false,
        free: false,
        label: customLabel || 'رفتن به سبد',
      };

    case 'add_free_reward':
    default:
      return {
        addsItem: true,
        free: true,
        label: suggestion.requiresSelection
          ? 'انتخاب و افزودن'
          : customLabel || 'دریافت هدیه',
      };
  }
}

/** آیا پیشنهاد باید نمایش داده شود (نه برای این stateKey، نه ردشده) */
export function shouldShowSuggestion(
  suggestion:
    | Pick<PromotionSuggestionView, 'stateKey' | 'promotionId'>
    | null
    | undefined,
  context: {
    popupShownFor: string | null;
    dismissedStateKey: string | null;
    dismissedPromotionIds: number[];
  },
): boolean {
  if (!suggestion) {
    return false;
  }

  if (suggestion.stateKey === context.popupShownFor) {
    return false;
  }

  if (suggestion.stateKey === context.dismissedStateKey) {
    return false;
  }

  return !context.dismissedPromotionIds.includes(suggestion.promotionId);
}

export const SUGGESTION_ACTIONS: SuggestionAction[] = [
  'add_free_reward',
  'add_paid_item',
  'open_cart',
];
