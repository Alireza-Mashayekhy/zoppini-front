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
    <div
      ref={sectionRef}
      className="h-[calc(100vh-52px)] w-full overflow-hidden relative"
    >
      <LuxuryTitle className="p-10">New In</LuxuryTitle>
      <div ref={sliderRef} className="keen-slider group">
        {products.map(product => {
          const colorImage = product.product.colorImages?.find(
            img => img?.color?.id === product?.colorId,
          );
          const image = colorImage?.url || '';

          // واریانت مربوط به رنگ
          const variant = product.product.variants?.find(
            v => v?.colorId === product?.colorId,
          );
          const price = variant?.price || 0;

          return (
            <div key={product.id} className="keen-slider__slide number-slide1">
              <ProductCard
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
