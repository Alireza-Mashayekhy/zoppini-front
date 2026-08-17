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
  return (
    <Link href={`/product/${slug}`} className="flex h-full min-h-0 flex-col">
      {/* تصویر */}
      {slider ? (
        <div className="relative min-h-0 flex-1">
          <Image
            src={process.env.NEXT_PUBLIC_IMAGE_URL + image}
            fill
            alt={title}
            className="object-cover"
          />
        </div>
      ) : (
        <div className="relative w-full aspect-9/16">
          <Image
            src={process.env.NEXT_PUBLIC_IMAGE_URL + image}
            fill
            alt={title}
            className="object-cover"
          />
        </div>
      )}

      {/* اطلاعات محصول */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-12 pt-3">
        <span className="line-clamp-1 overflow-hidden text-ellipsis">
          {title}
        </span>

        {!!price && price !== 0 && (
          <div className="flex flex-col whitespace-nowrap">
            {discount && (
              <span className="whitespace-nowrap text-sm">
                {discount?.finalPrice.toLocaleString()} تومان
              </span>
            )}
            <span
              className={cn(
                discount ? 'text-xs line-through' : 'text-sm',
                'whitespace-nowrap',
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
