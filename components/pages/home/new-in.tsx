'use client';

import 'keen-slider/keen-slider.min.css';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useKeenSlider } from 'keen-slider/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';

import LuxuryTitle from '@/components/shared/luxury-title';
import ProductCard from '@/components/shared/product-card';
import { FeaturedProductResponse } from '@/services/features/products/type';

export default function NewIn({
  products,
}: {
  products: FeaturedProductResponse[];
}) {
  const [loaded, setLoaded] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

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

  useGSAP(() => {
    if (!sectionRef.current) return;

    gsap.to(sectionRef.current, {
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 52px',
        end: '+=500',
        scrub: 0.5,
        pin: true,
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-[calc(100vh-52px)] w-full flex-col overflow-hidden"
    >
      {/* عنوان */}
      <div className="shrink-0">
        <LuxuryTitle className="p-10">New In</LuxuryTitle>
      </div>

      {/* اسلایدر */}
      <div ref={sliderRef} className="keen-slider group min-h-0 flex-1">
        {products.map(product => {
          const colorImage = product.product.colorImages?.find(
            img => img?.color?.id === product?.colorId,
          );

          const image = colorImage?.url || '';

          const variant = product.product.variants?.find(
            v => v?.colorId === product?.colorId,
          );

          const price = variant?.price || 0;

          return (
            <div
              key={product.id}
              className="keen-slider__slide h-full! w-[calc(50%-8px)]! shrink-0 sm:w-[calc(33.333%-11px)]! lg:w-[calc(25%-12px)]!"
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

        {loaded && (
          <>
            <ChevronLeft
              onClick={() => instanceRef.current?.prev()}
              className="absolute left-5 top-1/2 z-10 size-8 -translate-y-1/2 cursor-pointer opacity-0 transition-all group-hover:opacity-100"
            />

            <ChevronRight
              onClick={() => instanceRef.current?.next()}
              className="absolute right-5 top-1/2 z-10 size-8 -translate-y-1/2 cursor-pointer opacity-0 transition-all group-hover:opacity-100"
            />
          </>
        )}
      </div>
    </section>
  );
}
