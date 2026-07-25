'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current || !trackRef.current) return;

      const section = sectionRef.current;
      const track = trackRef.current;

      const getScrollDistance = () => {
        return Math.max(0, track.scrollWidth - section.clientWidth);
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,

          start: 'top 52px',

          end: () => `+=${getScrollDistance()}`,

          scrub: 1,

          pin: true,

          anticipatePin: 1,

          invalidateOnRefresh: true,
        },
      });

      // حرکت افقی محصولات
      tl.to(track, {
        x: () => getScrollDistance(),

        duration: 1,

        ease: 'none',
      });

      // استپ کوچک انتهایی
      tl.to(
        {},
        {
          duration: 0.2,
        },
      );

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    {
      scope: sectionRef,
    },
  );

  return (
    <section
      ref={sectionRef}
      className="relative h-[calc(100vh-52px)] w-full overflow-hidden bg-white"
    >
      <div className="flex h-full w-full flex-col p-6">
        <LuxuryTitle className="mb-6 shrink-0">پیشنهاد استایل</LuxuryTitle>

        {/* viewport */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {/* track */}
          <div
            ref={trackRef}
            dir="rtl"
            className="flex h-full w-max flex-row gap-0"
          >
            {/* ویدیو - راست‌ترین آیتم */}
            <div className="h-full w-[66.666vw] shrink-0 sm:w-[40vw] lg:w-[28.57vw]">
              <video
                muted
                loop
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              >
                <source src="/home/style.mp4" type="video/mp4" />
              </video>
            </div>

            {/* محصولات - سمت چپ ویدیو */}
            {products.map(product => {
              const colorImage = product.product.colorImages?.find(
                img => img?.color?.id === product?.colorId,
              );

              const image = colorImage?.url || '';

              return (
                <Link
                  href={`/product/${product.product.slug}`}
                  key={product.id}
                  className="flex h-full w-[66.666vw] shrink-0 flex-col sm:w-[40vw] lg:w-[28.57vw]"
                >
                  <div className="relative min-h-0 flex-1">
                    <Image
                      src={process.env.NEXT_PUBLIC_IMAGE_URL + image}
                      fill
                      alt={product.product.title}
                      className="object-cover"
                    />
                  </div>

                  <div className="w-full shrink-0 bg-gray-800 p-4 text-center text-white">
                    {product.product.title}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
