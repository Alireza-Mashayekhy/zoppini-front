'use client';

import { useKeenSlider } from 'keen-slider/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import HlsVideo from '@/components/shared/hls-video';
import LuxuryTitle from '@/components/shared/luxury-title';
import { FeaturedProductResponse } from '@/services/features/products/type';

const AUTOPLAY_DELAY_MS = 4000;

export default function SuggestedStyle({
  products,
}: {
  products: FeaturedProductResponse[];
}) {
  const [loaded, setLoaded] = useState(false);
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,
      rtl: true,
      slides: {
        perView: 'auto',
        spacing: 2,
      },
      created() {
        setLoaded(true);
      },
    },
    [
      slider => {
        let timeout: ReturnType<typeof setTimeout> | undefined;
        let hovered = false;
        let held = false;

        const reducedMotion = () =>
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function clearNextTimeout() {
          clearTimeout(timeout);
        }

        function nextTimeout() {
          clearNextTimeout();

          if (hovered || held || reducedMotion()) return;

          timeout = setTimeout(() => {
            // یک محصول در هر بار؛ در موبایل پنل مربع همیشه یک اسلاید دارد.
            slider.next();
          }, AUTOPLAY_DELAY_MS);
        }

        const pause = () => {
          held = true;
          clearNextTimeout();
        };

        const release = () => {
          held = false;
          nextTimeout();
        };

        const onPointerUp = () => release();

        slider.on('created', () => {
          const container = slider.container;

          container.addEventListener('mouseenter', () => {
            hovered = true;
            clearNextTimeout();
          });
          container.addEventListener('mouseleave', () => {
            hovered = false;
            nextTimeout();
          });

          container.addEventListener('pointerdown', pause, { passive: true });
          container.addEventListener('focusin', pause);
          container.addEventListener('focusout', release);
          window.addEventListener('pointerup', onPointerUp);
          window.addEventListener('pointercancel', onPointerUp);

          nextTimeout();
        });

        slider.on('dragStarted', pause);
        slider.on('dragEnded', release);
        slider.on('animationEnded', nextTimeout);
        slider.on('updated', nextTimeout);

        slider.on('destroyed', () => {
          clearNextTimeout();
          window.removeEventListener('pointerup', onPointerUp);
          window.removeEventListener('pointercancel', onPointerUp);
        });
      },
    ],
  );

  // ویدیو اسلاید جدا و بالای کاروسل است؛ تعداد اسلایدهای کاروسل فقط محصولات‌اند.
  const totalSlides = products.length;

  return (
    <section
      id="home-style"
      data-home-section
      aria-label="پیشنهاد استایل"
      className="home-section home-section--full home-section--below-header relative flex w-full flex-col overflow-hidden bg-white"
    >
      <LuxuryTitle className="home-style-title mt-4 mb-6 shrink-0 px-6">
        پیشنهاد استایل
      </LuxuryTitle>

      <div className="home-style-stage group relative min-h-0 flex flex-1">
        {/* پنل ویدیو — در موبایل مربع و بالای کاروسل */}
        <div className="home-style-panel home-style-video-panel relative h-full min-w-[45vw] shrink-0 overflow-hidden lg:min-w-[32vw]">
          <HlsVideo
            src="/home/style/master.m3u8"
            poster="/home/style/poster.webp"
            className="h-full w-full object-cover"
          />
        </div>

        {/* پنل کاروسل محصولات — در موبایل مربع و پایین ویدیو */}
        <div
          ref={sliderRef}
          className="home-style-panel home-style-slider keen-slider h-full"
          dir="rtl"
          role="region"
          aria-roledescription="carousel"
          aria-label="محصولات پیشنهاد استایل"
        >
          {products.map((product, index) => {
            const colorImage = product.product.colorImages?.find(
              img => img?.color?.id === product?.colorId,
            );

            const image = colorImage?.url || '';

            return (
              <Link
                href={`/product/${product.product.slug}`}
                key={product.id}
                className="home-style-slide keen-slider__slide h-full! min-w-[50vw]! sm:min-w-[45vw]! lg:min-w-[32vw]! flex flex-col"
                aria-label={`${product.product.title} — محصول ${index + 1} از ${products.length}`}
              >
                <div className="home-style-slide-image relative min-h-0 flex-1">
                  <Image
                    src={process.env.NEXT_PUBLIC_IMAGE_URL + image}
                    fill
                    alt={product.product.title}
                    className="object-cover"
                    sizes="(min-width: 1024px) 32vw, (min-width: 640px) 45vw, 80vw"
                    loading="lazy"
                  />
                </div>

                <div className="home-style-slide-label flex w-full shrink-0 flex-col items-center bg-primary px-4 py-2 text-center text-sm text-white">
                  <span>{product.enTitle.toUpperCase()}</span>
                  <span>{product.faTitle}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* کنترل‌ها — روی لمس هم دیده می‌شوند */}
        {loaded && totalSlides > 1 && (
          <>
            <button
              type="button"
              onClick={() => instanceRef.current?.prev()}
              className="absolute left-1.5 top-1/2 home-style-control z-10 flex size-11 -translate-y-1/2 lg:size-10 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 lg:left-5 lg:opacity-0 lg:group-hover:opacity-100"
              aria-label="اسلاید قبلی"
            >
              <ChevronLeft className="size-6" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => instanceRef.current?.next()}
              className="absolute right-1.5 top-1/2 home-style-control z-10 flex size-11 -translate-y-1/2 lg:size-10 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 lg:right-5 lg:opacity-0 lg:group-hover:opacity-100"
              aria-label="اسلاید بعدی"
            >
              <ChevronRight className="size-6" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
