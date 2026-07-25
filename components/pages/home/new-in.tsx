'use client';

import 'keen-slider/keen-slider.min.css';

import { useKeenSlider } from 'keen-slider/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import LuxuryTitle from '@/components/shared/luxury-title';
import ProductCard from '@/components/shared/product-card';
import { FeaturedProductResponse } from '@/services/features/products/type';

interface NewInProps {
  products: FeaturedProductResponse[];
}

export default function NewIn({ products }: NewInProps) {
  const [loaded, setLoaded] = useState(false);

  const [sliderRef, instanceRef] = useKeenSlider({
    loop: true,

    mode: 'free',

    rtl: true,

    slides: {
      perView: 'auto',
      spacing: 16,
    },

    created() {
      setLoaded(true);
    },
  });

  return (
    <section className="relative flex h-full w-full flex-col overflow-hidden bg-white">
      {/* Title */}
      <div className="shrink-0">
        <LuxuryTitle className="p-10">New In</LuxuryTitle>
      </div>

      {/* Slider */}
      <div ref={sliderRef} className="keen-slider group min-h-0 flex-1">
        {products.map(product => {
          const colorImage = product.product.colorImages?.find(
            image => image?.color?.id === product?.colorId,
          );

          const image = colorImage?.url || '';

          const variant = product.product.variants?.find(
            variant => variant?.colorId === product?.colorId,
          );

          const price = variant?.price || 0;

          return (
            <div
              key={product.id}
              className="
                keen-slider__slide
                h-full!
                w-[calc(50%-8px)]!
                shrink-0
                sm:w-[calc(33.333%-11px)]!
                lg:w-[calc(25%-12px)]!
              "
            >
              <ProductCard
                slider
                image={image}
                title={product.product.title}
                price={price}
                slug={product.product.slug}
              />
            </div>
          );
        })}

        {/* Controls */}
        {loaded && (
          <>
            <button
              type="button"
              onClick={() => instanceRef.current?.prev()}
              className="
                absolute
                left-5
                top-1/2
                z-10
                -translate-y-1/2
                opacity-0
                transition-opacity
                group-hover:opacity-100
              "
            >
              <ChevronLeft className="size-8" />
            </button>

            <button
              type="button"
              onClick={() => instanceRef.current?.next()}
              className="
                absolute
                right-5
                top-1/2
                z-10
                -translate-y-1/2
                opacity-0
                transition-opacity
                group-hover:opacity-100
              "
            >
              <ChevronRight className="size-8" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
