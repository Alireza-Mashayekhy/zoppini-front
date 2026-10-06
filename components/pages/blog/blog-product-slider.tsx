'use client';

import 'keen-slider/keen-slider.min.css';

import { useKeenSlider } from 'keen-slider/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import ProductCard from '@/components/shared/product-card';
import { BlogBlockItem } from '@/services/features/blog/types';

const SLIDE_SPACING = 12;

/**
 * اسلایدر محصولات داخل مقاله.
 *
 * محصول‌ها از پنل ادمین انتخاب می‌شوند؛ اگر محصولی حذف شده باشد
 * (product === null) از اسلایدر کنار گذاشته می‌شود.
 */
export default function BlogProductSlider({
  items,
  title,
  autoplay = true,
}: {
  items: BlogBlockItem[];
  title?: string | null;
  autoplay?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  const products = items.filter(item => item.product);

  const [sliderRef, instanceRef] = useKeenSlider(
    {
      rtl: true,
      loop: products.length > 3,
      slides: { perView: 1.6, spacing: SLIDE_SPACING },
      breakpoints: {
        '(min-width: 640px)': { slides: { perView: 2.5, spacing: SLIDE_SPACING } },
        '(min-width: 1024px)': { slides: { perView: 3.4, spacing: SLIDE_SPACING } },
      },
      created() {
        setLoaded(true);
      },
    },
    autoplay
      ? [
          slider => {
            let timeout: ReturnType<typeof setTimeout>;
            let mouseOver = false;

            const clearNextTimeout = () => clearTimeout(timeout);

            const nextTimeout = () => {
              clearTimeout(timeout);
              if (mouseOver) return;

              timeout = setTimeout(() => slider.next(), 4000);
            };

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
        ]
      : [],
  );

  /** با تغییر تعداد اسلایدها، اسلایدر دوباره محاسبه می‌شود */
  useEffect(() => {
    instanceRef.current?.update();
  }, [instanceRef, products.length]);

  if (products.length === 0) return null;

  return (
    <section className="my-8">
      {title && (
        <h2 className="mb-4 text-xl font-light text-[#1A1A1A] md:text-2xl">
          {title}
        </h2>
      )}

      <div className="group relative">
        <div ref={sliderRef} className="keen-slider h-[340px] sm:h-[380px]">
          {products.map((item, index) => {
            const product = item.product!;

            return (
              <div
                key={`${product.id}-${item.colorId ?? 'default'}-${index}`}
                className="keen-slider__slide relative"
              >
                <ProductCard
                  slider
                  image={product.image ?? ''}
                  title={product.title}
                  price={product.price}
                  slug={product.slug}
                />

                {item.badge && (
                  <span className="absolute start-2 top-2 z-10 rounded-full bg-[#1A1A1A] px-3 py-1 text-[10px] text-white">
                    {item.badge}
                  </span>
                )}

                {!product.inStock && (
                  <span className="absolute end-2 top-2 z-10 rounded-full bg-white/90 px-3 py-1 text-[10px] text-gray-700">
                    ناموجود
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {loaded && products.length > 1 && (
          <>
            <button
              type="button"
              aria-label="قبلی"
              onClick={() => instanceRef.current?.prev()}
              className="absolute end-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-1 opacity-0 shadow transition-opacity group-hover:opacity-100"
            >
              <ChevronRight className="size-6" />
            </button>

            <button
              type="button"
              aria-label="بعدی"
              onClick={() => instanceRef.current?.next()}
              className="absolute start-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-1 opacity-0 shadow transition-opacity group-hover:opacity-100"
            >
              <ChevronLeft className="size-6" />
            </button>
          </>
        )}
      </div>

    </section>
  );
}
