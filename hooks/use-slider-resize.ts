// hooks/use-slider-resize.ts
'use client';

import type { KeenSliderInstance } from 'keen-slider/react';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

interface UseSliderResizeOptions {
  /**
   * فاصله بین آخرین تغییر اندازه و بروزرسانی اسلایدر (میلی‌ثانیه).
   * کمی صبر می‌کنیم تا چیدمان مرورگر (مدیا کوئری‌ها، فونت‌ها، اسکرول‌بار)
   * کاملاً به ثبات برسد و بعد هندسه اسلایدر را دوباره محاسبه کنیم.
   */
  delay?: number;
  /**
   * بعد از هر بار همگام‌سازی با اندازه جدید صدا زده می‌شود؛
   * برای بروزرسانی استیت‌هایی که به ایندکس اسلایدر وابسته‌اند.
   */
  onResized?: (slider: KeenSliderInstance) => void;
}

/**
 * keen-slider فقط به رویداد `window.resize` گوش می‌دهد و آن هم تنها وقتی
 * عرض کانتینر عوض شده باشد اسلایدر را دوباره می‌سازد. این یعنی:
 *
 *   • اگر کانتینر بدون تغییر اندازه پنجره عوض شود (مثلاً چیدمان پدر تغییر کند)،
 *     هندسه اسلایدر قدیمی می‌ماند و اسلایدها نصفه/جابجا دیده می‌شوند.
 *   • اگر بروزرسانی داخلی قبل از نهایی شدن چیدمان اجرا شود، عرض‌ها کمی
 *     اشتباه محاسبه می‌شوند و در حالت loop کم‌کم جابجایی (دریفت) ایجاد می‌شود.
 *
 * این هوک با ResizeObserver روی خودِ کانتینر، بعد از فروکش کردن تغییر اندازه
 * یک بار `slider.update()` صدا می‌زند؛ `update` هندسه را از صفر می‌سازد و
 * اسلایدر را روی همان اسلاید فعال نگه می‌دارد.
 *
 * نکته: ref برگشتی را باید روی همان المانی بگذارید که ref خود keen-slider
 * روی آن است. برای راحتی می‌توانید از خودِ آن به‌عنوان ورودی استفاده کنید:
 *
 * ```tsx
 * const [sliderRef, instanceRef] = useKeenSlider({ ... });
 * const resizeRef = useSliderResize(sliderRef, instanceRef);
 *
 * <div ref={resizeRef} className="keen-slider">…</div>
 * ```
 */
export function useSliderResize<T extends HTMLElement>(
  sliderRef: (node: T | null) => void,
  instanceRef: RefObject<KeenSliderInstance | null>,
  { delay = 150, onResized }: UseSliderResizeOptions = {},
) {
  const [container, setContainer] = useState<T | null>(null);

  const onResizedRef = useRef(onResized);
  useEffect(() => {
    onResizedRef.current = onResized;
  });

  const composedRef = useCallback(
    (node: T | null) => {
      sliderRef(node);
      setContainer(node);
    },
    [sliderRef],
  );

  useEffect(() => {
    if (!container || typeof ResizeObserver === 'undefined') return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastWidth = container.clientWidth;
    let lastHeight = container.clientHeight;

    const sync = () => {
      const slider = instanceRef.current;
      if (!slider) return;

      // update() خودش انیمیشن در حال اجرا را متوقف می‌کند، هندسه را از نو
      // می‌سازد و بعد ایندکس فعال را دوباره اعمال می‌کند.
      slider.update();
      onResizedRef.current?.(slider);
    };

    const observer = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      // تغییرات زیر یک پیکسل (مثلاً گرد شدن اعشار) مهم نیستند
      if (
        Math.abs(width - lastWidth) < 0.5 &&
        Math.abs(height - lastHeight) < 0.5
      ) {
        return;
      }

      lastWidth = width;
      lastHeight = height;

      clearTimeout(timer);
      timer = setTimeout(sync, delay);
    });

    observer.observe(container);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [container, instanceRef, delay]);

  return composedRef;
}
