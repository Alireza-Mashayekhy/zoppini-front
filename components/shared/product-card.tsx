'use client';

import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import CompareToggle, {
  cardActionButtonClass,
} from '@/components/shared/compare-toggle';
import QuickAddDialog from '@/components/shared/quick-add-dialog';
import { cn } from '@/lib/utils';
import { ProductDiscount } from '@/services/features/discounts/types';

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
  discount?: ProductDiscount;
  /** نمایش دکمه‌های کوچک روی کارت (پیش‌فرض روشن؛ بدون id پنهان است) */
  showActions?: boolean;
}

export default function ProductCard({
  id,
  image,
  title,
  subtitle,
  price,
  slug,
  slider,
  discount,
  showActions = true,
}: ProductProps) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const hasDiscount =
    !!discount &&
    price > 0 &&
    discount.finalPrice > 0 &&
    discount.finalPrice < price;

  const discountPercent = hasDiscount
    ? Math.round(((price - discount.finalPrice) / price) * 100)
    : 0;

  const imageUrl = process.env.NEXT_PUBLIC_IMAGE_URL + image;

  const showCardActions = showActions && id != null;

  return (
    <div
      className="group relative flex h-full min-h-0 w-full flex-col overflow-hidden border border-[#e8e6e3] bg-white"
      dir="rtl"
    >
      <Link
        href={`/product/${slug}`}
        className="flex h-full min-h-0 w-full flex-col p-0"
      >
        {/* تصویر بدون padding تا لبه‌های کارت؛ ارتفاع اسلایدر از والد می‌آید. */}
        <div
          className={cn(
            'relative w-full overflow-hidden bg-[#f7f7f7]',
            slider ? 'min-h-0 flex-1' : 'aspect-[4/5] shrink-0',
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

          {!!price && price !== 0 && (
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
          )}
        </div>
      </Link>

      {/* دکمه‌های فعلی بدون تغییر شکل/جایگاه: بالا-چپ؛ hover دسکتاپ و نمایش دائمی لمسی. */}
      {showCardActions && (
        <div className="absolute top-3 right-3 flex z-20 gap-1.5 transition-opacity duration-200 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:pointer-events-none [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover:pointer-events-auto [@media(hover:hover)_and_(pointer:fine)]:focus-within:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:focus-within:pointer-events-auto">
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            aria-label="افزودن به سبد خرید"
            title="افزودن به سبد خرید"
            className={cardActionButtonClass}
          >
            <ShoppingCart className="size-4" />
          </button>

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
      )}

      {/* دیالوگ فقط هنگام باز شدن mount می‌شود تا درخواستی ارسال نشود */}
      {quickAddOpen && (
        <QuickAddDialog slug={slug} open onOpenChange={setQuickAddOpen} />
      )}
    </div>
  );
}
