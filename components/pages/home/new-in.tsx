'use client';

import 'keen-slider/keen-slider.min.css';

import { useKeenSlider } from 'keen-slider/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import LuxuryTitle from '@/components/shared/luxury-title';
import ProductCard from '@/components/shared/product-card';
import { useSliderResize } from '@/hooks/use-slider-resize';
import { FeaturedProductResponse } from '@/services/features/products/type';

interface NewInProps {
  products: FeaturedProductResponse[];
}

const SLIDE_SPACING = 16;
const AUTOPLAY_DELAY_MS = 2500;

export default function NewIn({ products }: NewInProps) {
  const [loaded, setLoaded] = useState(false);

  const [sliderRef, instanceRef] = useKeenSlider(
    {
      loop: true,

      rtl: true,

      slides: {
        // موبایل: دقیقاً یک محصول در هر نما؛ دو کارت کنار هم ممنوع.
        perView: 1,
        spacing: SLIDE_SPACING,
      },

      breakpoints: {
        '(min-width: 640px)': {
          slides: { perView: 3, spacing: SLIDE_SPACING },
        },
        '(min-width: 1024px)': {
          slides: { perView: 4, spacing: SLIDE_SPACING },
        },
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

          // در حین تعامل کاربر یا با درخواست کاهش حرکت، خودکار جلو نرو.
          if (hovered || held || reducedMotion()) return;

          timeout = setTimeout(() => {
            // next() همیشه دقیقاً یک محصول جلو می‌رود.
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

          // mouseenter/leave فقط یک بار و بدون flicker بین فرزندان.
          container.addEventListener('mouseenter', () => {
            hovered = true;
            clearNextTimeout();
          });
          container.addEventListener('mouseleave', () => {
            hovered = false;
            nextTimeout();
          });

          // لمس/درگ: تا وقتی انگشت یا اشاره‌گر روی کارت است، پخش خودکار متوقف.
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

  const resizeRef = useSliderResize(sliderRef, instanceRef);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white pb-0 sm:pb-5">
      {/* Title — در موبایل فشرده‌تر تا کارت بزرگ‌تر و کامل‌تر دیده شود. */}
      <div className="shrink-0 pt-3 sm:pt-5">
        <LuxuryTitle className="px-4 pb-1 sm:p-10" left>
          New In
        </LuxuryTitle>
      </div>

      {/*
        Stage بیرونی padding کناری دارد تا کارت در موبایل از فلش‌ها و
        کنترل‌های شناور فاصله بگیرد؛ عرض اسلاید از عرض محتوای همین Stage
        محاسبه می‌شود. container-type هم عرض کارت را با ارتفاع محدود می‌کند
        تا کارت هرگز از کادر یک‌صفحه‌ای بیرون نزند. فلش‌ها عمداً بیرون از
        keen-slider و نسبت به Stage قرار می‌گیرند تا در padding کناری
        بنشینند، نه روی خود کارت.
      */}
      <div className="home-new-in-stage group relative min-h-0 flex-1 sm:px-0">
        <div
          ref={resizeRef}
          className="keen-slider h-full"
          role="region"
          aria-roledescription="carousel"
          aria-label="جدیدترین محصولات"
        >
          {products.map((product, index) => {
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
                className="keen-slider__slide h-full! w-full shrink-0 sm:w-[calc(33.333%-10.67px)] lg:w-[calc(25%-12px)]"
                role="group"
                aria-roledescription="slide"
                aria-label={`محصول ${index + 1} از ${products.length}`}
              >
                <div className="home-new-in-card">
                  <ProductCard
                    slider
                    squareImageOnMobile
                    id={product.product.id}
                    image={image}
                    title={product.product.title}
                    price={price}
                    slug={product.product.slug}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls — روی لمس هم دیده می‌شوند و هدف لمسی ۴۴px دارند. */}
        {loaded && (
          <>
            <button
              type="button"
              onClick={() => instanceRef.current?.prev()}
              aria-label="محصول قبلی"
              title="محصول قبلی"
              className="absolute left-2 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-stone-900 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 lg:left-5 lg:size-8 lg:rounded-none lg:bg-transparent lg:shadow-none lg:backdrop-blur-none lg:hover:bg-transparent lg:opacity-0 lg:group-hover:opacity-100"
            >
              <ChevronLeft className="size-6 lg:size-8" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => instanceRef.current?.next()}
              aria-label="محصول بعدی"
              title="محصول بعدی"
              className="absolute right-2 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-stone-900 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 lg:right-5 lg:size-8 lg:rounded-none lg:bg-transparent lg:shadow-none lg:backdrop-blur-none lg:hover:bg-transparent lg:opacity-0 lg:group-hover:opacity-100"
            >
              <ChevronRight className="size-6 lg:size-8" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
