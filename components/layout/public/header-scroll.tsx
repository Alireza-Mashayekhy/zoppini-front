'use client';

import { useEffect, useRef, useState } from 'react';

interface HeaderScrollProps {
  children: React.ReactNode;
}

export default function HeaderScroll({ children }: HeaderScrollProps) {
  const [isVisible, setIsVisible] = useState(true);

  const lastScrollY = useRef(0);
  const ticking = useRef(false);

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

  return (
    <div
      className={`fixed left-0 top-0 z-50 w-full transition-transform duration-300 ease-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {children}
    </div>
  );
}
