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
      if (!wrapperRef.current || !categoriesRef.current || !newInRef.current) {
        return;
      }

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
       * مرحله 1
       *
       * دقیقاً مثل کد اول:
       * کل لیست دسته بندی ها با هم از پایین بالا می آید
       */
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

      /*
       * مرحله 2
       *
       * New In جداگانه و آهسته تر
       */
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

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      };
    },
    {
      scope: wrapperRef,
    },
  );

  return (
    <section ref={wrapperRef} className="relative h-screen overflow-hidden">
      {/* Hero */}
      <div className="absolute inset-0 z-0">
        <HeroSection categories={categories} categoriesRef={categoriesRef} />
      </div>

      {/* New In */}
      <div ref={newInRef} className="absolute inset-0 z-10">
        <NewIn products={products} />
      </div>
    </section>
  );
}
