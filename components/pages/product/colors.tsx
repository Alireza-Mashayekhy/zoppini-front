// components/pages/products/product-colors.tsx
'use client';

import Image from 'next/image';
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

interface ProductColorsProps {
  product: ProductsResponse;
  selectedColorId?: number;
  onColorSelect?: (colorId: number) => void;
}

export default function ProductColors({
  product,
  selectedColorId,
  onColorSelect,
}: ProductColorsProps) {
  const [localSelectedColorId, setLocalSelectedColorId] = useState<
    number | undefined
  >(selectedColorId);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [hoveredColorId, setHoveredColorId] = useState<number | null>(null);

  const uniqueColors =
    product.variants
      ?.map(v => v.color)
      .filter(
        (color, index, self) =>
          self.findIndex(c => c?.id === color?.id) === index,
      ) || [];

  const getColorImages = (colorId: number) => {
    return product.colorImages?.filter(img => img.color?.id === colorId) || [];
  };

  const handleColorClick = (colorId: number) => {
    setLocalSelectedColorId(colorId);
    if (onColorSelect) {
      onColorSelect(colorId);
    }
  };

  const activeColorId = localSelectedColorId || uniqueColors[0]?.id;

  const displayColorName = uniqueColors.find(
    c => c?.id === activeColorId,
  )?.name;

  const MAX_VISIBLE_COLORS = 6;
  const visibleColors = uniqueColors.slice(0, MAX_VISIBLE_COLORS);
  const remainingColors = uniqueColors.length - MAX_VISIBLE_COLORS;

  return (
    <div className="flex flex-col gap-2 mt-6 pb-3 border-b">
      <div className="text-sm font-medium text-gray-700 flex items-center gap-1">
        <div className="relative w-20 overflow-hidden group">
          <span
            className={cn(
              'block transition-transform duration-300',
              hoveredColorId !== null && activeColorId !== hoveredColorId
                ? 'translate-y-[-110%]'
                : '',
            )}
          >
            {displayColorName}
          </span>
          {visibleColors.map(color => {
            return (
              <span
                key={color?.id}
                className={cn(
                  'absolute inset-0 block transition-transform duration-300',
                  hoveredColorId === color?.id && activeColorId !== color?.id
                    ? 'translate-y-0'
                    : 'translate-y-full',
                )}
              >
                {color?.name}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 justify-between">
        {/* دکمه‌های رنگ */}
        <div className="flex items-center gap-1">
          {visibleColors.map(color => {
            const isActive = activeColorId === color?.id;

            return (
              <button
                key={color?.id}
                className={cn(
                  'w-5 h-5 transition-all duration-200 border border-black relative',
                )}
                style={{ backgroundColor: color.hexCode }}
                title={color?.name}
                onClick={() => handleColorClick(color?.id)}
                onMouseEnter={() => setHoveredColorId(color?.id)}
                onMouseLeave={() => setHoveredColorId(null)}
              >
                {isActive && (
                  <span className="absolute h-px w-full -bottom-1 bg-black left-0" />
                )}
              </button>
            );
          })}

          {/* نمایش تعداد رنگ‌های باقی‌مانده */}
          {remainingColors > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-8 h-8 rounded-full text-xs p-0 flex items-center justify-center"
              onClick={() => setIsSheetOpen(true)}
            >
              +{remainingColors}
            </Button>
          )}
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost">مشاهده رنگ‌ها</Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full! max-w-[500px]!">
            <SheetHeader>
              <SheetTitle>رنگ‌های محصول</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 px-5 gap-2">
              {uniqueColors.map(color => {
                const images = getColorImages(color?.id);
                const firstImage =
                  images.length > 0 ? images[0].url : product.image;

                return (
                  <div
                    key={color?.id}
                    className="cursor-pointer relative overflow-hidden group"
                    onClick={() => {
                      handleColorClick(color?.id);
                      setIsSheetOpen(false);
                    }}
                  >
                    <div className="relative w-full aspect-[0.8] bg-gray-100">
                      {firstImage ? (
                        <Image
                          src={process.env.NEXT_PUBLIC_IMAGE_URL + firstImage}
                          alt={color?.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: color.hexCode }}
                        />
                      )}
                    </div>
                    <div className="absolute bottom-1 right-2 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
                      <p className="font-medium">{color?.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
