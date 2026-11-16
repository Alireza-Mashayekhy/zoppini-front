'use client';

import { useEffect, useRef, useState } from 'react';

interface HeaderScrollProps {
  children: React.ReactNode;
}

/**
 * هدرِ چسبان سایت.
 *
 * دو رفتار دارد:
 *
 *   • **صفحه‌ی اصلی:** هدر همیشه چسبان و ثابت می‌ماند. دلایلش:
 *       – اسکرول بخش‌به‌بخش روی ارتفاع واقعی صفحه حساب می‌کند؛ اگر هدر بیاید
 *         و برود، ارتفاع صفحه و مبدأ بخش‌ها مدام عوض می‌شود و اسنپ می‌لرزد.
 *       – نوار پیشرفت اسکرول باید «بالای هدر» بماند، نه روی آن بپرد.
 *     تشخیص «صفحه‌ی اصلی» از مسیر انجام می‌شود، بدون هیچ تغییر بصری در هدر.
 *
 *   • **بقیه‌ی صفحه‌ها:** همان رفتار قبلی — با اسکرول به پایین پنهان و با
 *     اسکرول به بالا ظاهر می‌شود.
 *
 * هر دو حالت با `transform` کار می‌کنند (بدون جابه‌جایی چیدمان)، پس هنگام
 * شروع اسکرول هیچ layout shift رخ نمی‌دهد.
 */
export default function HeaderScroll({ children }: HeaderScrollProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [forceVisible, setForceVisible] = useState(false);

  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    /*
     * هدر در همه‌ی مسیرها به‌صورت `fixed` است؛ فقط همین صفحه‌ی اصلی است که
     * رفتار «همیشه چسبان» دارد.
     */
    const syncPinned = () => {
      const pathname = window.location.pathname;
      setForceVisible(pathname === '/' || pathname === '');
    };

    syncPinned();
    window.addEventListener('popstate', syncPinned);

    return () => window.removeEventListener('popstate', syncPinned);
  }, []);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      if (ticking.current) return;

      ticking.current = true;

      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const lastScroll = lastScrollY.current;

        // همیشه در ابتدای صفحه هدر نمایش داده شود
        if (currentScrollY <= 20) {
          setIsVisible(true);
          lastScrollY.current = currentScrollY;
          ticking.current = false;
          return;
        }

        const difference = currentScrollY - lastScroll;

        // جلوگیری از حساسیت بیش از حد
        if (Math.abs(difference) < 5) {
          ticking.current = false;
          return;
        }

        if (difference > 0) {
          // Scroll Down
          setIsVisible(false);
        } else {
          // Scroll Up
          setIsVisible(true);
        }

        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const visible = forceVisible || isVisible;

  return (
    <div
      className={`fixed left-0 top-0 z-50 w-full transition-transform duration-300 ease-out ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {children}
    </div>
  );
}
