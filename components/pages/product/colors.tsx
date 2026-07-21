// components/pages/product/colors.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
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
import { ColorResponse } from '@/services/features/products/type';

interface ColorLink {
  color: ColorResponse;
  productSlug: string;
  url: string;
}

interface ProductColorsProps {
  colorLinks: ColorLink[];
  selectedColorId?: number;
  onColorSelect?: (colorId: number) => void;
  currentSlug?: string; // اسلاگ محصول فعلی برای تشخیص رنگ‌های خود محصول
}

export default function ProductColors({
  colorLinks,
  selectedColorId,
  onColorSelect,
  currentSlug,
}: ProductColorsProps) {
  const [localSelectedColorId, setLocalSelectedColorId] = useState<
    number | undefined
  >(selectedColorId);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [hoveredColorId, setHoveredColorId] = useState<number | null>(null);

  // حذف رنگ‌های تکراری بر اساس id
  const uniqueColors = Array.from(
    new Map(colorLinks.map(item => [item.color.id, item])).values(),
  );

  const activeColorId = localSelectedColorId || uniqueColors[0]?.color.id;

  const activeColorName = uniqueColors.find(
    item => item.color.id === activeColorId,
  )?.color.name;

  const MAX_VISIBLE_COLORS = 6;
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
            {activeColorName}
          </span>
          {uniqueColors.map(({ color }) => (
            <span
              key={color.id}
              className={cn(
                'absolute inset-0 block transition-transform duration-300',
                hoveredColorId === color.id && activeColorId !== color.id
                  ? 'translate-y-0'
                  : 'translate-y-full',
              )}
            >
              {color.name}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-1">
          {uniqueColors.map(({ color, productSlug }) => {
            const isActive = activeColorId === color.id;
            const isSelf = productSlug === currentSlug;

            return (
              <Link
                key={color.id}
                href={`/product/${productSlug}`}
                className="block"
                onClick={e => {
                  // اگر رنگ مربوط به خود محصول است، از لینک شدن جلوگیری کن
                  if (isSelf) {
                    e.preventDefault();
                    if (onColorSelect) {
                      onColorSelect(color.id);
                      setLocalSelectedColorId(color.id);
                    }
                  }
                  // برای محصولات دیگر، لینک به صفحه‌ی آنها می‌رود
                }}
              >
                <button
                  className={cn(
                    'w-5 h-5 transition-all duration-200 border border-black relative',
                  )}
                  style={{ backgroundColor: color.hexCode }}
                  title={color.name}
                  onMouseEnter={() => setHoveredColorId(color.id)}
                  onMouseLeave={() => setHoveredColorId(null)}
                >
                  {isActive && (
                    <span className="absolute h-px w-full -bottom-1 bg-black left-0" />
                  )}
                </button>
              </Link>
            );
          })}

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
              {uniqueColors.map(({ color, productSlug, url }) => {
                const isSelf = productSlug === currentSlug;
                return (
                  <Link
                    key={color.id}
                    href={`/product/${productSlug}`}
                    className="cursor-pointer relative overflow-hidden group block"
                    onClick={e => {
                      if (isSelf) {
                        e.preventDefault();
                        if (onColorSelect) {
                          onColorSelect(color.id);
                          setLocalSelectedColorId(color.id);
                          setIsSheetOpen(false);
                        }
                      }
                    }}
                  >
                    <div className="relative w-full aspect-[0.8] bg-gray-100">
                      {url ? (
                        <Image
                          src={process.env.NEXT_PUBLIC_IMAGE_URL + url}
                          fill
                          objectFit="cover"
                          alt={productSlug}
                        />
                      ) : (
                        <div
                          className="w-full h-full"
                          style={{ backgroundColor: color.hexCode }}
                        />
                      )}
                    </div>
                    <div className="absolute bottom-1 right-2 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
                      <p className="font-medium">{color.name}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
