'use client';

import { ArrowDown } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import {
  ColorImageResponse,
  ProductsResponse,
} from '@/services/features/products/type';

const AUTOPLAY_INTERVAL = 3000; // هر ۳ ثانیه

interface ProductGalleryProps {
  product: ProductsResponse;
  colorImages: ColorImageResponse[];
}

// کامپوننت تصویر با قابلیت زوم
function ZoomableImage({
  src,
  alt,
  onZoomChange,
}: {
  src: string;
  alt: string;
  onZoomChange?: (zoomed: boolean) => void;
}) {
  const [zoom, setZoom] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const imageRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !zoom) return;

    const rect = imageRef.current.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPosition({ x, y });
  };

  const handleClick = () => {
    setZoom(prev => {
      const next = !prev;
      onZoomChange?.(next);
      return next;
    });
  };

  return (
    <div
      ref={imageRef}
      className={cn(
        'relative w-full h-full overflow-hidden',
        zoom ? 'cursor-zoom-out' : 'cursor-zoom-in',
      )}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
    >
      <div
        className="relative w-full h-full transition-transform duration-300 ease-out"
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
  const currentIndexRef = useRef(0);

  const [isPaused, setIsPaused] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const images = colorImages;
  const displayImages =
    images.length > 0 ? images : [{ url: product.image, id: 0 }];

  const scrollTo = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const { clientHeight } = scrollRef.current;
    scrollRef.current.scrollTo({
      top: index * clientHeight,
      behavior: 'smooth',
    });
  }, []);

  // مدیریت اسکرول عمودی و به‌روزرسانی dots
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const { scrollTop, clientHeight } = container;
        // وقتی وسط اسلاید بعدی رد شد به‌عنوان اسلاید فعلی انتخاب می‌شود
        const index = Math.floor(
          (scrollTop + clientHeight * 0.5) / clientHeight,
        );
        const clampedIndex = Math.max(
          0,
          Math.min(index, displayImages.length - 1),
        );
        setCurrentIndex(clampedIndex);
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [displayImages.length]);

  useEffect(() => {
    if (displayImages.length <= 1) return;
    if (isPaused || isZoomed) {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
      return;
    }
    autoplayTimerRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = (prev + 1) % displayImages.length;
        scrollTo(nextIndex);
        return nextIndex;
      });
    }, AUTOPLAY_INTERVAL);

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    };
  }, [displayImages.length, isPaused, isZoomed, scrollTo]);

  return (
    <div
      className="relative w-full md:w-auto md:h-[calc(100vh-70px)] aspect-13/16 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {' '}
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
              onZoomChange={setIsZoomed}
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
                  ? 'bg-primary w-4 h-2'
                  : 'bg-primary/50 hover:bg-white/70',
              )}
              onClick={() => scrollTo(index)}
              aria-label={`رفتن به تصویر ${index + 1}`}
            />
          ))}
        </div>
      )}
      {displayImages.length > 1 && (
        <div className="absolute bottom-4 right-4">
          <ArrowDown />
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
