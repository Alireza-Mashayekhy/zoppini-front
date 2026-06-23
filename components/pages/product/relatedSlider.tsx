// components/pages/product/related-slider.tsx
'use client';

import 'keen-slider/keen-slider.min.css';

import { useKeenSlider } from 'keen-slider/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import LuxuryTitle from '@/components/shared/luxury-title';
import ProductCard from '@/components/shared/product-card';
import { ProductsResponse } from '@/services/features/products/type';

interface RelatedSliderProps {
  products: ProductsResponse[];
  label: string;
}

export default function RelatedSlider({ products, label }: RelatedSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesCount, setSlidesCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    rtl: true,
    slides: {
      perView: 'auto',
      spacing: 8,
    },
    breakpoints: {
      '(min-width: 640px)': {
        slides: { perView: 3, spacing: 8 },
      },
      '(min-width: 768px)': {
        slides: { perView: 4, spacing: 8 },
      },
      '(min-width: 1024px)': {
        slides: { perView: 5, spacing: 8 },
      },
    },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
      setSlidesCount(slider.track.details.slides.length);
    },
    created(slider) {
      setSlidesCount(slider.track.details.slides.length);
    },
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  if (products.length === 0) {
    return null;
  }

  const goPrev = () => {
    if (instanceRef.current) {
      instanceRef.current.prev();
    }
  };

  const goNext = () => {
    if (instanceRef.current) {
      instanceRef.current.next();
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="relative w-full">
      <LuxuryTitle className="mb-4 px-4">{label}</LuxuryTitle>

      <div className="relative group">
        <div ref={sliderRef} className="keen-slider">
          {products.map(product => (
            <div
              key={product.id}
              className="keen-slider__slide"
              style={{ minWidth: '200px', maxWidth: '250px' }}
            >
              <ProductCard
                image={product.image}
                title={product.title}
                price={product.variants?.[0]?.price || 0}
                slug={product.slug}
              />
            </div>
          ))}
        </div>

        {/* دکمه قبلی */}
        {slidesCount > 1 && (
          <button
            className="absolute w-7 h-7 flex items-center justify-center left-0 translate-x-1/2 top-1/2 -translate-y-1/2  rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white z-10 disabled:opacity-0"
            onClick={goNext}
            disabled={currentSlide === slidesCount - 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* دکمه بعدی */}
        {slidesCount > 1 && (
          <button
            className="absolute w-7 h-7 flex items-center justify-center right-0 -translate-x-1/2 top-1/2 -translate-y-1/2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white z-10 disabled:opacity-0"
            onClick={goPrev}
            disabled={currentSlide === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
