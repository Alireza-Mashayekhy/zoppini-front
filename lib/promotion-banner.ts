/**
 * انتخاب پروموشنی که بنر صفحهٔ محصول را می‌سازد.
 *
 * قاعده (بدون هیچ محاسبهٔ تخفیف تازه):
 * - فقط از میان نشان‌هایی انتخاب می‌شود که خودِ بک‌اند در
 *   `promotionBadges` برگردانده است؛ یعنی صلاحیت محصول، دامنه، بازهٔ زمانی و
 *   تنظیم «نمایش نشان» قبلاً تأیید شده‌اند.
 * - فقط «تخفیف سبد» با پاداش درصدیِ مثبت بنر می‌گیرد؛ چون متن بنر
 *   «تخفیف ویژه سبد خرید شما» است. هر نشان دیگری با همان ظاهر قبلی نمایش
 *   داده می‌شود.
 * - درصد از `rewardValue` واقعی خوانده می‌شود؛ هیچ عددی پیش‌فرض یا هاردکد
 *   نیست. اگر درصد معتبر نباشد، بنر رندر نمی‌شود.
 */
import { PromotionRewardType, PromotionType } from '@/services/features/promotions/types';

export type ProductBadgeLike = {
  promotionId: number;
  name?: string;
  badgeText: string;
  type: string;
  rewardType?: PromotionRewardType | string;
  rewardValue?: number | string | null;
};

export type CartPromotionBanner = {
  promotionId: number;
  name: string;
  percent: number;
};

export function selectCartPromotionBanner(
  badges: ProductBadgeLike[] | null | undefined,
): CartPromotionBanner | null {
  if (!badges?.length) return null;

  for (const badge of badges) {
    if (badge.type !== PromotionType.CART_DISCOUNT) continue;
    if (badge.rewardType !== PromotionRewardType.PERCENTAGE) continue;

    const percent = Number(badge.rewardValue);
    if (!Number.isFinite(percent) || percent <= 0) continue;

    return {
      promotionId: badge.promotionId,
      name: badge.name?.trim() || badge.badgeText,
      percent,
    };
  }

  return null;
}
