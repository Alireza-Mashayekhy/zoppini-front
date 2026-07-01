// components/pages/home/suggested-style.tsx
'use client';

import 'keen-slider/keen-slider.min.css';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useKeenSlider } from 'keen-slider/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

import LuxuryTitle from '@/components/shared/luxury-title';
import { FeaturedProductResponse } from '@/services/features/products/type';

gsap.registerPlugin(ScrollTrigger);

export default function SuggestedStyle({
  products,
}: {
  products: FeaturedProductResponse[];
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const sliderWrapperRef = useRef<HTMLDivElement>(null);

  const [sliderRef] = useKeenSlider({
    rtl: true,
    breakpoints: {
      '(min-width: 640px)': { slides: { perView: 2.5, spacing: 2 } },
      '(min-width: 1024px)': { slides: { perView: 3.5, spacing: 2 } },
    },
    slides: { perView: 1.5, spacing: 2 },
  });

  useGSAP(() => {
    if (!sectionRef.current || !sliderWrapperRef.current) return;

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
      <div
        ref={sliderWrapperRef}
        className="h-[calc(100vh-52px)] w-full flex flex-col p-6"
      >
        <LuxuryTitle className="mb-6 shrink-0">پیشنهاد استایل</LuxuryTitle>
        <div ref={sliderRef} className="keen-slider flex-1 min-h-0">
          <div className="keen-slider__slide h-full bg-gray-100 flex items-center justify-center">
            <video muted loop autoPlay className="w-full h-full object-cover">
              <source src="/home/style.mp4" type="video/mp4" />
            </video>
          </div>
          {products.map(product => {
            const colorImage = product.product.colorImages?.find(
              img => img?.color?.id === product?.colorId,
            );
            const image = colorImage?.url || '';
            return (
              <Link
                href={`/product/${product.product.slug}`}
                key={product.id}
                className="keen-slider__slide h-full flex flex-col"
              >
                <div className="relative w-full flex-1">
                  <Image
                    src={process.env.NEXT_PUBLIC_IMAGE_URL + image}
                    fill
                    alt={product.product.title}
                    className="object-cover"
                  />
                </div>
                <div className="w-full text-center bg-gray-800 text-white p-4 shrink-0">
                  {product.product.title}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
