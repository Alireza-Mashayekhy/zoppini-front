// components/pages/product/product-info.tsx
'use client';

import { memo, useCallback, useState } from 'react';

import { CareGuideView } from '@/components/pages/product/product-guides';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ProductGuidesForCustomer } from '@/services/features/product-guides/type';
import { ProductsResponse } from '@/services/features/products/type';

interface ProductInfoProps {
  product: ProductsResponse;
  guides?: ProductGuidesForCustomer | null;
}

// کامپوننت محتوای شیت با memo برای جلوگیری از رندر مجدد
const SheetContentBody = memo(
  ({
    content,
    product,
    guides,
  }: {
    content: 'description' | 'careInstructions' | null;
    product: ProductsResponse;
    guides?: ProductGuidesForCustomer | null;
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
      if (guides?.careGuide?.instructions?.length) {
        return (
          <div className="space-y-4">
            <CareGuideView careGuide={guides.careGuide} />

            {product.careInstructionsHtml && (
              <div
                className="prose prose-sm max-w-none border-t pt-4 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: product.careInstructionsHtml,
                }}
              />
            )}
          </div>
        );
      }

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

export default function ProductInfo({ product, guides }: ProductInfoProps) {
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
            <SheetContentBody
              content={sheetContent}
              product={product}
              guides={guides}
            />{' '}
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
