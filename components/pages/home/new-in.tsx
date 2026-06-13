'use client';

import 'keen-slider/keen-slider.min.css';

import { useKeenSlider } from 'keen-slider/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import ProductCard from '@/components/shared/product-card';

export default function NewIn() {
  const [loaded, setLoaded] = useState(false);

  const [sliderRef, instanceRef] = useKeenSlider({
    loop: true,
    mode: 'free',
    rtl: true,
    breakpoints: {
      '(min-width: 640px)': {
        slides: { perView: 3 },
      },
      '(min-width: 1024px)': {
        slides: { perView: 4 },
      },
    },
    slides: {
      perView: 2,
    },
    created() {
      setLoaded(true);
    },
  });

  return (
    <div>
      <h2 className="p-10 text-2xl font-semibold ">جدیدتری محصولات</h2>
      <div ref={sliderRef} className="keen-slider group">
        {[1, 2, 3, 4, 5].map(product => (
          <div key={product} className="keen-slider__slide number-slide1">
            <ProductCard
              image="/home/5 (5).jpg"
              title="پیراهن مردانه"
              price={100000}
            />
          </div>
        ))}
        {loaded && (
          <>
            <ChevronLeft
              onClick={() => instanceRef.current?.prev()}
              className={`absolute top-1/2 left-5 size-8 -translate-y-1/2 transition-all opacity-0 group-hover:opacity-100`}
            />

            <ChevronRight
              onClick={() => instanceRef.current?.next()}
              className={`absolute top-1/2 right-5 size-8 -translate-y-1/2 transition-all opacity-0 group-hover:opacity-100`}
            />
          </>
        )}
      </div>
    </div>
  );
}
