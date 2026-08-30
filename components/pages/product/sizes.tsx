'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ProductsResponse } from '@/services/features/products/type';

interface ProductSizesProps {
  product: ProductsResponse;
  selectedSizeId?: number;
  onSizeSelect?: (sizeId: number) => void;
}

export default function ProductSizes({
  product,
  selectedSizeId,
  onSizeSelect,
}: ProductSizesProps) {
  const [localSelectedSizeId, setLocalSelectedSizeId] = useState<
    number | undefined
  >(selectedSizeId);

  const [hoveredSizeId, setHoveredSizeId] = useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const uniqueSizes =
    product.variants
      ?.map(v => v.size)
      .filter(
        (size, index, self) => self.findIndex(s => s.id === size.id) === index,
      ) || [];

  // آیا حداقل یک variant از این سایز موجود است؟
  const isSizeAvailable = (sizeId: number) => {
    return (
      product.variants?.some(
        variant => variant.size?.id === sizeId && variant.stock > 0,
      ) ?? false
    );
  };

  const handleSizeClick = (sizeId: number) => {
    // اگر سایز موجود نیست، اجازه انتخاب نده
    if (!isSizeAvailable(sizeId)) {
      return;
    }

    setLocalSelectedSizeId(sizeId);
    onSizeSelect?.(sizeId);
  };

  // اگر سایز انتخاب‌شده بعداً ناموجود شد،
  // اولین سایز موجود را انتخاب کن
  useEffect(() => {
    if (localSelectedSizeId && !isSizeAvailable(localSelectedSizeId)) {
      const firstAvailableSize = uniqueSizes.find(size =>
        isSizeAvailable(size.id),
      );

      setLocalSelectedSizeId(firstAvailableSize?.id);

      if (firstAvailableSize) {
        onSizeSelect?.(firstAvailableSize.id);
      }
    }
  }, [product.variants]);

  const activeSizeId =
    localSelectedSizeId && isSizeAvailable(localSelectedSizeId)
      ? localSelectedSizeId
      : uniqueSizes.find(size => isSizeAvailable(size.id))?.id;

  return (
    <div className="mt-6 flex flex-col gap-2">
      {' '}
      <div className="flex items-center justify-between">
        {' '}
        <span className="text-sm font-medium">سایز</span>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="text-sm">
              راهنمای سایز
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-full! max-w-[500px]!">
            <SheetHeader>
              <SheetTitle>راهنمای سایز</SheetTitle>
            </SheetHeader>

            {/* محتوای راهنمای سایز */}
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          {uniqueSizes.map(size => {
            const isAvailable = isSizeAvailable(size.id);
            const isActive = activeSizeId === size.id;
            const isHovered = hoveredSizeId === size.id;

            return (
              <button
                key={size.id}
                type="button"
                disabled={!isAvailable}
                className={cn(
                  'relative pb-1 text-sm font-medium transition-opacity',
                  !isAvailable && 'cursor-not-allowed opacity-40',
                )}
                title={isAvailable ? size.name : `${size.name} - ناموجود`}
                onClick={() => handleSizeClick(size.id)}
                onMouseEnter={() => setHoveredSizeId(size.id)}
                onMouseLeave={() => setHoveredSizeId(null)}
              >
                {size.name}

                <span
                  className={cn(
                    'absolute bottom-0 left-0 h-px w-full bg-black transition-transform duration-300 ease-in-out',
                  )}
                  style={{
                    transform:
                      isAvailable && (isActive || isHovered)
                        ? 'scaleX(1)'
                        : 'scaleX(0)',
                    transformOrigin: isActive || isHovered ? 'left' : 'right',
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
