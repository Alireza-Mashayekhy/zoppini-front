'use client';

import 'keen-slider/keen-slider.min.css';

import {
  type KeenSliderInstance,
  type KeenSliderPlugin,
  useKeenSlider,
} from 'keen-slider/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import HlsVideo from '@/components/shared/hls-video';
import LuxuryTitle from '@/components/shared/luxury-title';
import { useSliderResize } from '@/hooks/use-slider-resize';
import { FeaturedProductResponse } from '@/services/features/products/type';

const AUTOPLAY_DELAY_MS = 4000;

function isSingleSlidePerView(slider: KeenSliderInstance): boolean {
  const slidesOpt = slider.options.slides;

  return (
    typeof slidesOpt === 'object' &&
    slidesOpt !== null &&
    slidesOpt.perView === 1
  );
}

/**
 * پلاگین کنترل ورق‌زدن تک‌کارت در موبایل + همگام‌سازی هندسه در تغییر بریک‌پوینت.
 *
 * • در حالت موبایل (`perView: 1`)، جابه‌جایی زندهٔ انگشت به حداکثر یک کارت
 *   از نقطهٔ شروع محدود می‌شود تا حتی وقتی عرض کارت از عرض کل صفحه کمتر است
 *   (گوشی‌های کوتاه)، با یک حرکت بیش از یک کارت رد نشود.
 * • پس از رها شدن انگشت، مقصد نهایی دقیقاً یکی از `{startIdx - 1, startIdx,
 *   startIdx + 1}` (محدود به `minIdx..maxIdx`) انتخاب و روی ابتدای کارت اسنپ
 *   می‌شود؛ هیچ پرش چندتایی یا توقف بین دو اسلاید رخ نمی‌دهد.
 * • هنگام گذار از موبایل به تبلت (`perView: 'auto'`)، پس از پاک شدن
 *   عرض‌های اینلاین قبلی یک بار `slider.update()` اجرا می‌شود تا عرض واقعی
 *   کارت‌های دسکتاپ بدون خطا محاسبه شود.
 */
export const suggestedStyleMobileSwipePlugin: KeenSliderPlugin = slider => {
  let dragStartIdx: number | null = null;
  let dragStartPos: number | null = null;

  slider.on('dragStarted', () => {
    const details = slider.track.details;
    if (!details) {
      dragStartIdx = null;
      dragStartPos = null;
      return;
    }

    dragStartIdx = Math.round(details.position);
    dragStartPos = details.position;
  });

  slider.on('dragged', () => {
    if (!isSingleSlidePerView(slider) || dragStartIdx === null || !slider.track.details) {
      return;
    }

    const pos = slider.track.details.position;
    const minPos = dragStartIdx - 0.999;
    const maxPos = dragStartIdx + 0.999;

    if (pos < minPos) {
      slider.track.to(minPos);
    } else if (pos > maxPos) {
      slider.track.to(maxPos);
    }
  });

  slider.on('dragEnded', () => {
    if (!isSingleSlidePerView(slider) || dragStartIdx === null || !slider.track.details) {
      dragStartIdx = null;
      dragStartPos = null;
      return;
    }

    const startIdx = dragStartIdx;
    const startPos = dragStartPos ?? startIdx;
    dragStartIdx = null;
    dragStartPos = null;

    const details = slider.track.details;
    const posDelta = details.position - startPos;
    const vel = slider.track.velocity();

    let step = 0;
    if (
      Math.abs(vel) > 0 &&
      Math.abs(posDelta) > 0.02 &&
      Math.sign(vel) === Math.sign(posDelta)
    ) {
      step = Math.sign(vel);
    } else if (Math.abs(posDelta) >= 0.5) {
      step = Math.sign(posDelta);
    }

    const minAllowed = Math.max(details.minIdx, startIdx - 1);
    const maxAllowed = Math.min(details.maxIdx, startIdx + 1);
    const targetIdx = Math.min(
      Math.max(startIdx + step, minAllowed),
      maxAllowed,
    );

    if (slider.animator.targetIdx !== targetIdx || !slider.animator.active) {
      slider.animator.stop();
      const dist = slider.track.idxToDist(targetIdx, true);
      if (dist) {
        slider.moveToIdx(targetIdx, true);
      } else {
        slider.track.to(targetIdx);
      }
    }
  });

  slider.on('optionsChanged', () => {
    const slidesOpt = slider.options.slides;
    if (
      typeof slidesOpt === 'object' &&
      slidesOpt !== null &&
      slidesOpt.perView === 'auto'
    ) {
      slider.slides.forEach(slide => {
        slide.style.removeProperty('min-width');
        slide.style.removeProperty('max-width');
      });
      slider.update();
    }
  });
};

export default function SuggestedStyle({
  products,
}: {
  products: FeaturedProductResponse[];
}) {
  const [loaded, setLoaded] = useState(false);
  const totalSlides = products.length;
  const canSlide = totalSlides > 1;

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: canSlide,
      drag: canSlide,
      mode: 'snap',
      rtl: true,
      slides: {
        /*
         * موبایل (پیش‌فرض): دقیقاً یک کارت کامل مربعی در هر نما، بدون فاصله و
         * بدون سرکِ کارت بعدی. تبلت چیدمان قبلی را حفظ می‌کند؛ در دسکتاپ
         * دو کارت کامل با فاصلهٔ ۱۶px نمایش داده می‌شوند.
         */
        perView: 1,
        spacing: 0,
        origin: 'auto',
      },
      breakpoints: {
        '(min-width: 640px)': {
          slides: { perView: 'auto', spacing: 2, origin: 'auto' },
        },
        '(min-width: 1024px)': {
          loop: totalSlides > 2,
          drag: totalSlides > 2,
          slides: {
            perView: totalSlides === 1 ? 1 : 2,
            spacing: 16,
            origin: 'auto',
          },
        },
      },
      created() {
        setLoaded(true);
      },
    },
    [
      suggestedStyleMobileSwipePlugin,
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

          const slides = slider.options.slides;
          const visibleSlides =
            typeof slides === 'object' &&
            slides !== null &&
            typeof slides.perView === 'number'
              ? slides.perView
              : 1;
          if (slider.slides.length <= visibleSlides) return;
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

  // Recompute Keen's geometry when a responsive parent changes size without a window resize.
  const resizeRef = useSliderResize(sliderRef, instanceRef);

  // همگام‌سازی هندسه و تعداد اسلایدها در صورت تغییر آرایه محصولات
  useEffect(() => {
    instanceRef.current?.update();
  }, [instanceRef, totalSlides]);

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
        {/* پنل ویدیو — در موبایل افقی ۱۶:۹ و بالای کاروسل */}
        <div className="home-style-panel home-style-video-panel relative h-full min-w-[45vw] shrink-0 overflow-hidden lg:min-w-[32vw]">
          <HlsVideo
            src="/home/style/master.m3u8"
            poster="/home/style/poster.webp"
            className="h-full w-full object-cover"
          />
        </div>

        {/* پنل کاروسل محصولات — در موبایل مربع ۱:۱ و پایین ویدیو */}
        <div
          ref={resizeRef}
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
            const variant = product.product.variants?.find(
              variant => variant?.colorId === product.colorId,
            );
            const discount = product.product.discount ?? undefined;
            const price = discount?.originalPrice ?? variant?.price ?? 0;
            // Match the existing ProductCard sale presentation.
            const hasDiscount =
              !!discount &&
              price > 0 &&
              discount.finalPrice > 0 &&
              discount.finalPrice < price;
            const discountPercent = hasDiscount
              ? Math.round(
                  discount.effectivePercent != null &&
                  Number.isFinite(discount.effectivePercent)
                    ? discount.effectivePercent
                    : ((price - discount.finalPrice) / price) * 100,
                )
              : 0;

            return (
              <Link
                href={`/product/${product.product.slug}`}
                key={product.id}
                className="home-style-slide keen-slider__slide h-full! w-full shrink-0 min-w-0! sm:w-auto sm:min-w-[45vw]! lg:min-w-0! flex flex-col"
                aria-label={`${product.product.title} — محصول ${index + 1} از ${products.length}`}
              >
                <div className="home-style-slide-image relative min-h-0 flex-1">
                  <Image
                    src={process.env.NEXT_PUBLIC_IMAGE_URL + image}
                    fill
                    alt={product.product.title}
                    className="object-cover lg:object-contain"
                    sizes="(min-width: 1024px) 32vw, (min-width: 640px) 45vw, 80vw"
                    loading="lazy"
                  />
                </div>

                <div className="home-style-slide-label flex w-full shrink-0 flex-col items-center bg-primary px-4 py-2 text-center text-sm text-white">
                  <span>{product.enTitle.toUpperCase()}</span>
                  <span>{product.faTitle}</span>
                  <span className="home-style-product-title hidden lg:block">
                    {product.product.title}
                  </span>
                  {price > 0 && (
                    <span className="home-style-price hidden lg:flex" dir="rtl">
                      <span>
                        <bdi>
                          {Math.trunc(hasDiscount ? discount.finalPrice : price).toLocaleString('fa-IR')}
                        </bdi>{' '}
                        تومان
                      </span>
                      {hasDiscount && (
                        <>
                          <del aria-label={`قیمت قبلی ${Math.trunc(price).toLocaleString('fa-IR')} تومان`}>
                            <bdi>{Math.trunc(price).toLocaleString('fa-IR')}</bdi>
                          </del>
                          <span aria-label={`${discountPercent.toLocaleString('fa-IR')} درصد تخفیف`}>
                            {discountPercent.toLocaleString('fa-IR')}٪
                          </span>
                        </>
                      )}
                    </span>
                  )}
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
              className={`absolute left-1.5 top-1/2 home-style-control home-style-control--left z-10 flex size-11 -translate-y-1/2 lg:size-10 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 lg:left-5 lg:opacity-0 lg:group-hover:opacity-100 ${totalSlides <= 2 ? 'lg:hidden' : ''}`}
              aria-label="اسلاید قبلی"
            >
              <ChevronLeft className="size-6" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => instanceRef.current?.next()}
              className={`absolute right-1.5 top-1/2 home-style-control home-style-control--right z-10 flex size-11 -translate-y-1/2 lg:size-10 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 lg:right-5 lg:opacity-0 lg:group-hover:opacity-100 ${totalSlides <= 2 ? 'lg:hidden' : ''}`}
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
