'use client';

import { useKeenSlider } from 'keen-slider/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import HlsVideo from '@/components/shared/hls-video';
import LuxuryTitle from '@/components/shared/luxury-title';
import { FeaturedProductResponse } from '@/services/features/products/type';

export default function SuggestedStyle({
  products,
}: {
  products: FeaturedProductResponse[];
}) {
  const [loaded, setLoaded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,
      rtl: true,
      slides: {
        perView: 'auto',
        spacing: 2,
      },
      slideChanged(slider) {
        setCurrentSlide(slider.track.details.rel);
      },
      created() {
        setLoaded(true);
      },
    },
    [
      slider => {
        let timeout: ReturnType<typeof setTimeout>;
        let mouseOver = false;
        function clearNextTimeout() {
          clearTimeout(timeout);
        }
        function nextTimeout() {
          clearTimeout(timeout);
          if (mouseOver) return;
          timeout = setTimeout(() => {
            slider.next();
          }, 4000);
        }
        slider.on('created', () => {
          slider.container.addEventListener('mouseover', () => {
            mouseOver = true;
            clearNextTimeout();
          });
          slider.container.addEventListener('mouseout', () => {
            mouseOver = false;
            nextTimeout();
          });
          nextTimeout();
        });
        slider.on('dragStarted', clearNextTimeout);
        slider.on('animationEnded', nextTimeout);
        slider.on('updated', nextTimeout);
      },
    ],
  );

  const totalSlides = products.length + 1; // +1 for video

  return (
    <section className="relative flex h-screen w-full flex-col overflow-hidden bg-white">
      <LuxuryTitle className="mb-6 mt-4 shrink-0 px-6">
        پیشنهاد استایل
      </LuxuryTitle>

      <div className="relative min-h-0 flex-1 group">
        {/* Slider */}
        <div ref={sliderRef} className="keen-slider h-full" dir="rtl">
          {/* ویدیو - اولین اسلاید */}
          <div className="keen-slider__slide h-full! min-w-[90vw]! sm:min-w-[45vw]! lg:min-w-[32vw]!">
            <HlsVideo
              src="/home/style/master.m3u8"
              poster="/home/style/poster.webp"
              className="h-full w-full object-cover"
            />
          </div>

          {/* محصولات */}
          {products.map(product => {
            const colorImage = product.product.colorImages?.find(
              img => img?.color?.id === product?.colorId,
            );

            const image = colorImage?.url || '';

            return (
              <Link
                href={`/product/${product.product.slug}`}
                key={product.id}
                className="keen-slider__slide h-full! min-w-[80vw]! sm:min-w-[45vw]! lg:min-w-[32vw]! flex flex-col"
              >
                <div className="relative min-h-0 flex-1">
                  <Image
                    src={process.env.NEXT_PUBLIC_IMAGE_URL + image}
                    fill
                    alt={product.product.title}
                    className="object-cover"
                    sizes="(min-width: 1024px) 32vw, (min-width: 640px) 45vw, 80vw"
                    loading="lazy"
                  />
                </div>

                <div className="w-full shrink-0 bg-primary px-4 py-2 text-sm text-center items-center text-white flex flex-col">
                  <span>{product.enTitle.toUpperCase()}</span>
                  <span>{product.faTitle}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* کنترل‌ها */}
        {loaded && totalSlides > 1 && (
          <>
            <button
              type="button"
              onClick={() => instanceRef.current?.prev()}
              className="absolute left-5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
              aria-label="اسلاید قبلی"
            >
              <ChevronLeft className="size-6" />
            </button>

            <button
              type="button"
              onClick={() => instanceRef.current?.next()}
              className="absolute right-5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
              aria-label="اسلاید بعدی"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}

        {/* Dots */}
        {loaded && totalSlides > 1 && (
          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => instanceRef.current?.moveToIdx(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx
                    ? 'w-6 bg-primary'
                    : 'w-2 bg-primary/40 hover:bg-primary/70'
                }`}
                aria-label={`رفتن به اسلاید ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
