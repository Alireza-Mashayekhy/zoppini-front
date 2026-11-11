import { Gift, Percent, Truck } from 'lucide-react';

import { PromotionProductBadge, PromotionType } from '@/services/features/promotions/types';

interface PromotionBadgeProps {
  badge: PromotionProductBadge | { text: string; type?: PromotionType };
  className?: string;
  /** اندازهٔ کوچک‌تر برای کارت محصول */
  compact?: boolean;
}

/** آیکون مناسب نوع پروموشن (به‌صورت المان، نه کامپوننت ساخته‌شده در رندر) */
function PromotionIcon({
  type,
  className,
}: {
  type?: PromotionType;
  className?: string;
}) {
  switch (type) {
    case PromotionType.FREE_SHIPPING:
      return <Truck className={className} />;

    case PromotionType.BUY_TRIGGER_GET_REWARD:
    case PromotionType.BUY_X_GET_Y_SAME_GROUP:
      return <Gift className={className} />;

    default:
      return <Percent className={className} />;
  }
}

/**
 * نشان پروموشن روی کارت محصول / صفحهٔ محصول.
 *
 * این نشان **قیمت را تغییر نمی‌دهد**؛ فقط توضیح می‌دهد چه پیشنهادی برای این
 * کالا وجود دارد. قیمت قابل پرداخت فقط بعد از احراز شرط در سبد محاسبه
 * می‌شود.
 */
export default function PromotionBadge({
  badge,
  className = '',
  compact = false,
}: PromotionBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 border border-[#ad2e38]/25 bg-[#ad2e38]/5 font-medium text-[#ad2e38]',
        compact
          ? 'px-1.5 py-0.5 text-[10px] leading-4'
          : 'px-2 py-1 text-xs leading-5',
        className,
      ].join(' ')}
      dir="rtl"
      data-testid="promotion-badge"
    >
      <PromotionIcon
        type={'type' in badge ? badge.type : undefined}
        className={compact ? 'size-3 shrink-0' : 'size-3.5 shrink-0'}
      />
      <span className="line-clamp-2">{badge.text}</span>
    </span>
  );
}
