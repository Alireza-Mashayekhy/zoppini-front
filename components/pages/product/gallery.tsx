// components/pages/product/gallery.tsx
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { ProductsResponse } from '@/services/features/products/type';

interface ProductGalleryProps {
  product: ProductsResponse;
  selectedColorId?: number;
}

export default function ProductGallery({
  product,
  selectedColorId,
}: ProductGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // فیلتر تصاویر بر اساس رنگ انتخاب‌شده
  const images =
    product.colorImages?.filter(img => img.color?.id === selectedColorId) || [];
  const displayImages =
    images.length > 0 ? images : [{ url: product.image, id: 0 }];

  // مدیریت اسکرول عمودی و به‌روزرسانی dots
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, clientHeight } = container;
      const index = Math.round(scrollTop / clientHeight);
      setCurrentIndex(index);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [displayImages.length]);

  // اسکرول به تصویر مشخص
  const scrollTo = (index: number) => {
    if (scrollRef.current) {
      const { clientHeight } = scrollRef.current;
      scrollRef.current.scrollTo({
        top: index * clientHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative w-full aspect-square select-none">
      {/* کانتینر اسکرول عمودی */}
      <div
        ref={scrollRef}
        className={cn(
          'flex flex-col overflow-y-auto scroll-smooth snap-y snap-mandatory h-full',
          'scrollbar-hide', // مخفی کردن اسکرول‌بار
        )}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {displayImages.map((img, index) => (
          <div
            key={img.id || index}
            className="w-full flex-shrink-0 snap-start h-full"
          >
            <div className="relative w-full h-full bg-gray-100">
              <Image
                src={process.env.NEXT_PUBLIC_IMAGE_URL + img.url}
                alt={product.title}
                fill
                className="object-cover"
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>

      {/* نقاط ناوبری (عمودی) */}
      {displayImages.length > 1 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {displayImages.map((_, index) => (
            <button
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                currentIndex === index
                  ? 'bg-white w-4 h-2'
                  : 'bg-white/50 hover:bg-white/70',
              )}
              onClick={() => scrollTo(index)}
              aria-label={`رفتن به تصویر ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* شمارنده تصاویر */}
      {displayImages.length > 1 && (
        <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1} / {displayImages.length}
        </div>
      )}
    </div>
  );
}
