'use client';

import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import CompareToggle, { cardActionButtonClass } from '@/components/shared/compare-toggle';
import QuickAddDialog from '@/components/shared/quick-add-dialog';
import { cn } from '@/lib/utils';
import { ProductDiscount } from '@/services/features/discounts/types';

interface ProductProps {
  /** شناسه محصول — برای دکمه‌های مقایسه و خرید سریع لازم است */
  id?: number;
  image: string;
  title: string;
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
    <div className="group relative flex h-full min-h-0 flex-col">
      <Link href={`/product/${slug}`} className="flex h-full min-h-0 flex-col">
        {/* تصویر */}
        {slider ? (
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <Image
              src={imageUrl}
              fill
              alt={title}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 75vw"
              loading="lazy"
            />

            {hasDiscount && (
              <div className="absolute right-3 top-3 z-10 flex items-center justify-center bg-red-600 px-2 py-1 text-white shadow-md">
                <div className="flex gap-1 items-center leading-none">
                  <span className="text-sm font-semibold">
                    {discountPercent}٪
                  </span>

                  <span className="mt-0.5 text-[9px] opacity-90">تخفیف</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative aspect-9/16 w-full overflow-hidden">
            <Image
              src={imageUrl}
              fill
              alt={title}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(min-width: 1024px) 35vw, (min-width: 640px) 50vw, 75vw"
              loading="lazy"
            />

            {/* Discount Badge */}
            {hasDiscount && (
              <div className="absolute right-3 top-3 z-2 flex items-center justify-center bg-red-600 px-2 aspect-square rounded-full text-white shadow-md">
                <div className="flex gap-1 items-center leading-none">
                  <span className="text-sm font-semibold">
                    {discountPercent}٪
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* اطلاعات محصول */}
        <div className="flex flex-col sm:flex-row shrink-0 items-center justify-between gap-1 sm:gap-3 px-2 pb-12 pt-3 sm:px-5">
          <span className="self-start line-clamp-1 overflow-hidden text-ellipsis text-[10px] sm:text-sm">
            {title}
          </span>

          {!!price && price !== 0 && (
            <div className="flex self-end flex-row-reverse sm:flex-col items-end whitespace-nowrap gap-2 sm:gap-0">
              {hasDiscount && (
                <span className="text-[10px] sm:text-sm font-medium">
                  {discount.finalPrice.toLocaleString()} تومان
                </span>
              )}

              <span
                className={cn(
                  'whitespace-nowrap',
                  hasDiscount
                    ? 'text-[8px] sm:text-sm text-gray-400 line-through'
                    : 'text-[10px] sm:text-sm',
                )}
              >
                {parseInt(price.toString()).toLocaleString()} تومان
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* دکمه‌های سریع: افزودن به سبد و مقایسه
          - موس (hover-capable): تا هاور نشدن پنهان‌اند
          - لمسی (موبایل/تبلت): همیشه نمایان‌اند چون هاور نداریم
          - در نوار خالی پایین کارت می‌نشینند تا روی تصویر/متن نیفتند */}
      {showCardActions && (
        <div className="absolute bottom-3 start-3 z-20 flex gap-1.5 transition-opacity duration-200 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:pointer-events-none [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover:pointer-events-auto [@media(hover:hover)_and_(pointer:fine)]:focus-within:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:focus-within:pointer-events-auto">
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
