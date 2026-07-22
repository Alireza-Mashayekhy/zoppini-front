'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import {
  ColorImageResponse,
  ProductsResponse,
} from '@/services/features/products/type';

interface ProductGalleryProps {
  product: ProductsResponse;
  colorImages: ColorImageResponse[];
}

// کامپوننت تصویر با قابلیت زوم
function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [zoom, setZoom] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  };

  return (
    <div
      ref={imageRef}
      className="relative w-full h-full overflow-hidden cursor-zoom-in"
      onMouseEnter={() => setZoom(true)}
      onMouseLeave={() => setZoom(false)}
      onMouseMove={handleMouseMove}
    >
      <div
        className="relative w-full h-full transition-transform duration-200"
        style={{
          transform: zoom ? 'scale(2.5)' : 'scale(1)',
          transformOrigin: `${position.x}% ${position.y}%`,
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          draggable={false}
        />
      </div>
    </div>
  );
}

export default function ProductGallery({
  product,
  colorImages,
}: ProductGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = colorImages;
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
          'scrollbar-hide',
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
            <ZoomableImage
              src={process.env.NEXT_PUBLIC_IMAGE_URL + img.url}
              alt={product.title}
            />
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
