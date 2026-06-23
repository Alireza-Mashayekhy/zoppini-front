// components/pages/products/product-sizes.tsx
'use client';

import { useState } from 'react';

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

  const handleSizeClick = (sizeId: number) => {
    setLocalSelectedSizeId(sizeId);
    if (onSizeSelect) {
      onSizeSelect(sizeId);
    }
  };

  const activeSizeId = localSelectedSizeId || uniqueSizes[0]?.id;

  return (
    <div className="flex flex-col gap-2 mt-6">
      <div className="flex items-center justify-between">
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

      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-6">
          {uniqueSizes.map(size => {
            const isActive = activeSizeId === size.id;
            const isHovered = hoveredSizeId === size.id;

            return (
              <button
                key={size.id}
                className="relative text-sm font-medium pb-1"
                title={size.name}
                onClick={() => handleSizeClick(size.id)}
                onMouseEnter={() => setHoveredSizeId(size.id)}
                onMouseLeave={() => setHoveredSizeId(null)}
              >
                {size.name}
                <span
                  className={cn(
                    'absolute bottom-0 left-0 h-px bg-black w-full transition-transform duration-300 ease-in-out',
                  )}
                  style={{
                    transform:
                      isActive || isHovered ? 'scaleX(1)' : 'scaleX(0)',
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
