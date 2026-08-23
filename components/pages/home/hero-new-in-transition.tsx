'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';

import HeroSection from '@/components/pages/home/hero-section';
import NewIn from '@/components/pages/home/new-in';
import { CategoriesResponse } from '@/services/features/categories/types';
import { FeaturedProductResponse } from '@/services/features/products/type';

gsap.registerPlugin(ScrollTrigger);

interface HeroNewInTransitionProps {
  categories: CategoriesResponse[];
  products: FeaturedProductResponse[];
}

export default function HeroNewInTransition({
  categories,
  products,
}: HeroNewInTransitionProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const newInRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!wrapperRef.current || !newInRef.current) {
        return;
      }

      const mm = gsap.matchMedia();

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: 'top top',

          // کل مسیر اسکرول
          end: '+=1600',

          scrub: 1,

          pin: true,

          anticipatePin: 1,

          invalidateOnRefresh: true,
        },
      });

      /*
       * مرحله 1 (اختیاری)
       *
       * اگر categoriesRef به المانی وصل باشد،
       * لیست دسته‌بندی‌ها از پایین بالا می‌آید
       */
      if (categoriesRef.current) {
        timeline.fromTo(
          categoriesRef.current,
          {
            yPercent: 120,
          },
          {
            yPercent: 0,
            duration: 1,
            ease: 'power2.out',
          },
        );
      }

      /*
       * مرحله 2
       *
       * New In جداگانه و آهسته تر
       */
      mm.add('(min-width: 768px)', () => {
        timeline.fromTo(
          newInRef.current,
          {
            zIndex: 10,
          },
          {
            zIndex: 30,
            ease: 'none',
          },
        );

        timeline.fromTo(
          newInRef.current,
          {
            yPercent: 100,
          },
          {
            yPercent: 0,

            // افزایش این مقدار = حرکت آهسته تر
            duration: 0.5,

            ease: 'none',
          },
        );

        timeline.to(
          {},
          {
            duration: 0.2,
          },
        );
      });

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
        mm.revert();
      };
    },
    {
      scope: wrapperRef,
    },
  );

  return (
    <section
      ref={wrapperRef}
      className="relative min-h-screen sm:h-screen overflow-hidden"
    >
      {/* Hero */}
      <div className="relative sm:absolute inset-0 z-20 h-screen sm:h-auto">
        <HeroSection categories={categories} categoriesRef={categoriesRef} />
      </div>

      {/* New In */}
      <div
        ref={newInRef}
        className="relative sm:absolute inset-0 z-10 h-[500px] sm:h-auto"
      >
        <NewIn products={products} />
      </div>
    </section>
  );
}
