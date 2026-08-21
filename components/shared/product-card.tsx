import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { ProductDiscount } from '@/services/features/discounts/types';

interface ProductProps {
  image: string;
  title: string;
  price: number;
  slug: string;
  slider?: boolean;
  discount?: ProductDiscount;
}

export default function ProductCard({
  image,
  title,
  price,
  slug,
  slider,
  discount,
}: ProductProps) {
  const hasDiscount =
    !!discount &&
    price > 0 &&
    discount.finalPrice > 0 &&
    discount.finalPrice < price;

  const discountPercent = hasDiscount
    ? Math.round(((price - discount.finalPrice) / price) * 100)
    : 0;

  const imageUrl = process.env.NEXT_PUBLIC_IMAGE_URL + image;

  return (
    <Link
      href={`/product/${slug}`}
      className="group flex h-full min-h-0 flex-col"
    >
      {/* تصویر */}
      {slider ? (
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <Image
            src={imageUrl}
            fill
            alt={title}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
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
          />

          {/* Discount Badge */}
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
      )}

      {/* اطلاعات محصول */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-2 pb-12 pt-3 sm:px-5">
        <span className="line-clamp-1 overflow-hidden text-ellipsis text-sm sm:text-base">
          {title}
        </span>

        {!!price && price !== 0 && (
          <div className="flex flex-col items-end whitespace-nowrap">
            {hasDiscount && (
              <span className="text-sm font-medium text-red-600">
                {discount.finalPrice.toLocaleString()} تومان
              </span>
            )}

            <span
              className={cn(
                'whitespace-nowrap',
                hasDiscount ? 'text-xs text-gray-400 line-through' : 'text-sm',
              )}
            >
              {parseInt(price.toString()).toLocaleString()} تومان
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
