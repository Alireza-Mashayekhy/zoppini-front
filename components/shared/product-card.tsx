'use client';

import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import CompareToggle, {
  cardActionButtonClass,
} from '@/components/shared/compare-toggle';
import PromotionBadge from '@/components/shared/promotion-badge';
import QuickAddDialog from '@/components/shared/quick-add-dialog';
import { cn } from '@/lib/utils';
import type {
  ProductDiscount,
  ProductDiscountStage,
} from '@/services/features/discounts/types';
import {
  PromotionProductBadge,
  PromotionType,
} from '@/services/features/promotions/types';

interface ProductProps {
  /** شناسه محصول — برای دکمه‌های مقایسه و خرید سریع لازم است */
  id?: number;
  image: string;
  title: string;
  /** توضیح کوتاه واقعی محصول، در صورت ارائه توسط API؛ بدون متن ساختگی */
  subtitle?: string;
  price: number;
  slug: string;
  slider?: boolean;
  /**
   * فقط در موبایل (زیر ۶۴۰px) ناحیه‌ی تصویر را مربع می‌کند.
   *
   * در کارت‌های داخل اسلایدر، ارتفاع تصویر از والد می‌آید؛ برای New In
   * موبایل باید تصویر مربع و بدون کشیدگی باشد، اما چیدمان دسکتاپ همان
   * ارتفاع کشسان قبلی بماند.
   */
  squareImageOnMobile?: boolean;
  discount?: ProductDiscount;
  /**
   * نشان پروموشن (متنی، بدون تغییر قیمت).
   * قیمت کارت هرگز بر اساس این نشان عوض نمی‌شود.
   */
  promotionBadge?: PromotionProductBadge & { type?: PromotionType } | null;
  /** نمایش دکمه‌های کوچک روی کارت (پیش‌فرض روشن؛ بدون id پنهان است) */
  showActions?: boolean;
}

/** نمایش دکمه‌ها: روی دسکتاپ با hover/focus، روی لمسی همیشه */
const actionsRevealClass =
  'transition-opacity duration-200 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:pointer-events-none [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover:pointer-events-auto [@media(hover:hover)_and_(pointer:fine)]:focus-within:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:focus-within:pointer-events-auto';

/** درصد واقعیِ اعمال‌شده در هر مرحله (با احتساب سقف مبلغ تخفیف). */
function appliedStagePercent(stage: ProductDiscountStage): number {
  if (stage.priceBefore <= 0 || stage.discountAmount <= 0) return 0;
  return Math.max(
    0,
    Math.round((stage.discountAmount / stage.priceBefore) * 100),
  );
}

export default function ProductCard({
  id,
  image,
  title,
  subtitle,
  price,
  slug,
  slider,
  squareImageOnMobile,
  discount,
  promotionBadge,
  showActions = true,
}: ProductProps) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const hasDiscount =
    !!discount &&
    price > 0 &&
    discount.finalPrice > 0 &&
    discount.finalPrice < price;

  const effectivePercent = discount?.effectivePercent;
  const discountPercent = hasDiscount
    ? Math.round(
        effectivePercent != null && Number.isFinite(effectivePercent)
          ? effectivePercent
          : ((price - discount.finalPrice) / price) * 100,
      )
    : 0;

  /** مراحل واقعیِ اعمال‌شده؛ برای تخفیف تک‌مرحله‌ای از چیدمان قبلی استفاده می‌شود. */
  const appliedStages =
    hasDiscount && discount.stages
      ? discount.stages.filter(
          stage =>
            stage.priceBefore > 0 &&
            stage.discountAmount > 0 &&
            stage.priceAfter < stage.priceBefore,
        )
      : [];
  const hasStackedStages = hasDiscount && appliedStages.length > 1;

  const imageUrl = process.env.NEXT_PUBLIC_IMAGE_URL + image;

  const showCardActions = showActions && id != null;

  return (
    <div
      data-product-card
      className="group relative flex h-full min-h-0 w-full flex-col overflow-hidden border border-[#e8e6e3] bg-white"
      dir="rtl"
    >
      <Link
        href={`/product/${slug}`}
        className="flex h-full min-h-0 w-full flex-col p-0"
      >
        {/* تصویر بدون padding تا لبه‌های کارت؛ ارتفاع اسلایدر از والد می‌آید. */}
        <div
          data-product-image
          className={cn(
            'relative w-full overflow-hidden bg-[#f7f7f7]',
            slider ? 'min-h-0 flex-1' : 'aspect-[4/5] shrink-0',
            squareImageOnMobile && 'home-product-image--square-mobile',
          )}
        >
          <Image
            src={imageUrl}
            fill
            alt={title}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 75vw"
            loading="lazy"
          />

          {hasDiscount && (
            <span
              className="absolute left-3 top-0 z-10 flex h-14 w-11 items-start justify-center bg-[#ad2e38] pt-3 text-xs font-semibold text-white"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
              }}
              aria-label={`${discountPercent.toLocaleString('fa-IR')} درصد تخفیف`}
              title={`تخفیف کل ${discountPercent.toLocaleString('fa-IR')}٪`}
            >
              {discountPercent.toLocaleString('fa-IR')}٪
            </span>
          )}
        </div>

        {/* فاصله داخلی فقط برای متن است، نه برای تصویر. */}
        <div className="flex shrink-0 flex-col gap-2 px-3 py-3 text-right sm:px-4">
          <span className="line-clamp-1 min-h-5 text-xs font-semibold leading-5 text-[#1a1a1a] sm:text-sm">
            {title}
          </span>
          {subtitle && (
            <span className="line-clamp-1 text-[11px] leading-5 text-[#85817c] sm:text-xs">
              {subtitle}
            </span>
          )}

          {promotionBadge?.text && (
            <PromotionBadge badge={promotionBadge} compact />
          )}

          {!!price &&
            price !== 0 &&
            (hasStackedStages ? (
              <div
                className="mt-1 flex flex-col items-start gap-1"
                data-stacked-discount
              >
                {appliedStages.map((stage, index) => {
                  const percent = appliedStagePercent(stage);
                  const stageLabel =
                    stage.title?.trim() ||
                    `مرحله ${(index + 1).toLocaleString('fa-IR')}`;

                  return (
                    <div
                      key={`${stage.discountId}-${index}`}
                      className="flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5"
                      data-discount-stage={index + 1}
                    >
                      <del
                        className="whitespace-nowrap text-[10px] font-normal text-[#a6a29d] sm:text-xs"
                        aria-label={`قیمت قبل از ${stageLabel}: ${Math.trunc(stage.priceBefore).toLocaleString('fa-IR')} تومان`}
                      >
                        <bdi>
                          {Math.trunc(stage.priceBefore).toLocaleString(
                            'fa-IR',
                          )}
                        </bdi>
                      </del>
                      {percent > 0 && (
                        <span
                          className="inline-flex shrink-0 items-center bg-[#ad2e38] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white sm:text-[11px]"
                          aria-label={`${stageLabel}: ${percent.toLocaleString('fa-IR')} درصد تخفیف`}
                        >
                          {percent.toLocaleString('fa-IR')}٪
                        </span>
                      )}
                    </div>
                  );
                })}

                <span className="mt-0.5 inline-flex items-baseline gap-1 whitespace-nowrap text-xs font-semibold text-[#1a1a1a] sm:text-sm">
                  <bdi>
                    {Math.trunc(discount.finalPrice).toLocaleString('fa-IR')}
                  </bdi>
                  <span>تومان</span>
                </span>
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                <span className="inline-flex items-baseline gap-1 whitespace-nowrap text-xs font-semibold text-[#1a1a1a] sm:text-sm">
                  <bdi>
                    {Math.trunc(
                      hasDiscount ? discount.finalPrice : price,
                    ).toLocaleString('fa-IR')}
                  </bdi>
                  <span>تومان</span>
                </span>
                {hasDiscount && (
                  <del
                    className="whitespace-nowrap text-[10px] font-normal text-[#a6a29d] sm:text-xs"
                    aria-label={`قیمت قبلی ${Math.trunc(price).toLocaleString('fa-IR')} تومان`}
                  >
                    <bdi>{Math.trunc(price).toLocaleString('fa-IR')}</bdi>
                  </del>
                )}
              </div>
            ))}
        </div>
      </Link>

      {/* دکمه‌ها: سبد خرید بالا-راست، مقایسه بالا-چپ؛ hover دسکتاپ و نمایش دائمی لمسی. */}
      {showCardActions && (
        <>
          <div
            className={cn(
              'absolute right-1.5 top-1.5 z-20 flex gap-1.5 sm:right-3 sm:top-3',
              actionsRevealClass,
            )}
          >
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              aria-label="افزودن به سبد خرید"
              title="افزودن به سبد خرید"
              className={cardActionButtonClass}
            >
              <ShoppingCart className="size-4" />
            </button>
          </div>

          {/* زیر برچسب تخفیف قرار می‌گیرد تا روی آن نیفتد */}
          <div
            className={cn(
              'absolute left-1.5 z-20 sm:left-3',
              hasDiscount ? 'top-[4.25rem]' : 'top-1.5 sm:top-3',
              actionsRevealClass,
            )}
          >
            <CompareToggle
              product={{
                id,
                title,
                slug,
                image: imageUrl,
                price,
              }}
            />
          </div>
        </>
      )}

      {/* دیالوگ فقط هنگام باز شدن mount می‌شود تا درخواستی ارسال نشود */}
      {quickAddOpen && (
        <QuickAddDialog slug={slug} open onOpenChange={setQuickAddOpen} />
      )}
    </div>
  );
}
