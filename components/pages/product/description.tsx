// components/pages/product/product-info.tsx
'use client';

import { memo, useCallback, useState } from 'react';

import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ProductsResponse } from '@/services/features/products/type';

interface ProductInfoProps {
  product: ProductsResponse;
}

// کامپوننت محتوای شیت با memo برای جلوگیری از رندر مجدد
const SheetContentBody = memo(
  ({
    content,
    product,
  }: {
    content: 'description' | 'careInstructions' | null;
    product: ProductsResponse;
  }) => {
    if (content === 'description') {
      return (
        <div
          className="text-sm leading-relaxed prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: product.description || '' }}
        />
      );
    }
    if (content === 'careInstructions') {
      return (
        <div
          className="text-sm leading-relaxed prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: product.careInstructionsHtml || '',
          }}
        />
      );
    }
    return null;
  },
);
SheetContentBody.displayName = 'SheetContentBody';

export default function ProductInfo({ product }: ProductInfoProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetContent, setSheetContent] = useState<
    'description' | 'careInstructions' | null
  >(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const openSheet = useCallback((item: 'description' | 'careInstructions') => {
    setSheetContent(item);
    setIsSheetOpen(true);
  }, []);

  const handleSheetClose = useCallback((open: boolean) => {
    if (!open) {
      setSheetContent(null);
    }
    setIsSheetOpen(open);
  }, []);

  const handleHover = useCallback((item: string | null) => {
    setHoveredItem(item);
  }, []);

  return (
    <div className="pb-5">
      <div className="flex justify-between items-center gap-4">
        {/* دکمه توضیحات */}
        <button
          onClick={() => openSheet('description')}
          onMouseEnter={() => handleHover('description')}
          onMouseLeave={() => handleHover(null)}
          className="relative text-sm font-medium pb-1"
        >
          توضیحات
          <span
            className={cn(
              'absolute bottom-0 left-0 h-px bg-black w-full transition-transform duration-300 ease-in-out',
            )}
            style={{
              transform:
                sheetContent === 'description' || hoveredItem === 'description'
                  ? 'scaleX(1)'
                  : 'scaleX(0)',
              transformOrigin:
                sheetContent === 'description' || hoveredItem === 'description'
                  ? 'left'
                  : 'right',
            }}
          />
        </button>

        {/* دکمه نحوه شستشو */}
        <button
          onClick={() => openSheet('careInstructions')}
          onMouseEnter={() => handleHover('careInstructions')}
          onMouseLeave={() => handleHover(null)}
          className="relative text-sm font-medium pb-1"
        >
          نحوه شستشو
          <span
            className={cn(
              'absolute bottom-0 left-0 h-px bg-black w-full transition-transform duration-300 ease-in-out',
            )}
            style={{
              transform:
                sheetContent === 'careInstructions' ||
                hoveredItem === 'careInstructions'
                  ? 'scaleX(1)'
                  : 'scaleX(0)',
              transformOrigin:
                sheetContent === 'careInstructions' ||
                hoveredItem === 'careInstructions'
                  ? 'left'
                  : 'right',
            }}
          />
        </button>
      </div>

      {/* شیت سایدبار */}
      <Sheet open={isSheetOpen} onOpenChange={handleSheetClose}>
        <SheetContent
          side="right"
          className="w-full! max-w-[500px]! flex flex-col"
        >
          <SheetHeader>
            <SheetTitle>
              {sheetContent === 'description' ? 'توضیحات محصول' : 'نحوه شستشو'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <SheetContentBody content={sheetContent} product={product} />
          </div>

          <SheetFooter className="border-t pt-4">
            <div className="flex justify-between items-center w-full">
              <button
                onClick={() => openSheet('description')}
                onMouseEnter={() => handleHover('description')}
                onMouseLeave={() => handleHover(null)}
                className="relative text-sm font-medium pb-1"
              >
                توضیحات
                <span
                  className={cn(
                    'absolute bottom-0 left-0 h-px bg-black w-full transition-transform duration-300 ease-in-out',
                  )}
                  style={{
                    transform:
                      sheetContent === 'description' ||
                      hoveredItem === 'description'
                        ? 'scaleX(1)'
                        : 'scaleX(0)',
                    transformOrigin:
                      sheetContent === 'description' ||
                      hoveredItem === 'description'
                        ? 'left'
                        : 'right',
                  }}
                />
              </button>

              {/* دکمه نحوه شستشو */}
              <button
                onClick={() => openSheet('careInstructions')}
                onMouseEnter={() => handleHover('careInstructions')}
                onMouseLeave={() => handleHover(null)}
                className="relative text-sm font-medium pb-1"
              >
                نحوه شستشو
                <span
                  className={cn(
                    'absolute bottom-0 left-0 h-px bg-black w-full transition-transform duration-300 ease-in-out',
                  )}
                  style={{
                    transform:
                      sheetContent === 'careInstructions' ||
                      hoveredItem === 'careInstructions'
                        ? 'scaleX(1)'
                        : 'scaleX(0)',
                    transformOrigin:
                      sheetContent === 'careInstructions' ||
                      hoveredItem === 'careInstructions'
                        ? 'left'
                        : 'right',
                  }}
                />
              </button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
