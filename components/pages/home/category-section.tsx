'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

import { CategoriesResponse } from '@/services/features/categories/types';

gsap.registerPlugin(ScrollTrigger);

export default function CategoriesSection({
  categories,
}: {
  categories: CategoriesResponse[];
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const firstSectionRef = useRef<HTMLDivElement>(null);
  const secondSectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (
        !wrapperRef.current ||
        !firstSectionRef.current ||
        !secondSectionRef.current
      ) {
        return;
      }

      const firstSection = firstSectionRef.current;
      const secondSection = secondSectionRef.current;
      /*
       * ارتفاع واقعی بخش اول
       */
      const firstSectionHeight = firstSection.offsetHeight;

      /*
       * بخش اول + transition بخش دوم
       */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,

          start: `+=${firstSectionHeight} bottom`,

          /*
           * ابتدا کاربر باید کل بخش اول را طی کند
           * سپس بخش دوم بالا بیاید
           */
          end: `+=1600`,

          scrub: 1,

          pin: true,

          anticipatePin: 1,

          invalidateOnRefresh: true,
        },
      });

      /*
       * مرحله اول:
       *
       * بخش اول در viewport باقی می‌ماند.
       *
       * این فاصله زمانی باعث می‌شود کاربر بتواند
       * تا پایین 4 دسته‌بندی اول اسکرول کند.
       */
      tl.to(
        {},
        {
          duration: 0.5,
        },
      );

      /*
       * مرحله دوم:
       *
       * بخش دوم روی بخش اول می‌آید.
       */
      tl.fromTo(
        secondSection,
        {
          yPercent: 100,
        },
        {
          yPercent: 0,

          duration: 1,

          ease: 'none',
        },
      );

      tl.to(
        {},
        {
          duration: 0.2,
        },
      );

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    {
      scope: wrapperRef,
    },
  );

  return (
    <section
      ref={wrapperRef}
      className="relative w-full overflow-hidden bg-white"
    >
      {/* ================================================= */}
      {/* بخش اول */}
      {/* ================================================= */}

      <div
        ref={firstSectionRef}
        className="relative z-0 grid w-full grid-cols-4 bg-white"
      >
        {/* تصویر اول */}
        <div className="relative col-span-2 aspect-square">
          <Image
            src="/home/category_1.jpg"
            fill
            alt="image category 1"
            className="object-cover"
          />
        </div>

        {/* تصویر دوم */}
        <div className="relative col-span-2 aspect-square">
          <Image
            src="/home/category_2.jpg"
            fill
            alt="image category 2"
            className="object-cover"
          />
        </div>

        {/* دسته بندی های 1 تا 4 */}
        {categories.slice(0, 4).map(category => (
          <Link
            href={`/products/${category.slug}`}
            key={category.name}
            className="group relative mx-0.5 my-1 aspect-square bg-gray-300"
          >
            <Image
              src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${category.image}`}
              fill
              alt={category.name}
              className="object-cover"
            />

            <div className="absolute bottom-4 right-4 opacity-0 transition-all group-hover:opacity-100">
              {category.name}
            </div>
          </Link>
        ))}
      </div>

      {/* ================================================= */}
      {/* بخش دوم */}
      {/* ================================================= */}

      <div
        ref={secondSectionRef}
        className="absolute left-0 top-0 z-10 grid w-full grid-cols-4 bg-white"
      >
        {/* ویدیو اول */}
        <div className="relative col-span-2 aspect-square">
          <video
            muted
            loop
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          >
            <source src="/home/category_1.mp4" type="video/mp4" />
          </video>
        </div>

        {/* ویدیو دوم */}
        <div className="relative col-span-2 aspect-square">
          <video
            muted
            loop
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          >
            <source src="/home/category_2.mp4" type="video/mp4" />
          </video>
        </div>

        {/* دسته بندی های 5 تا 8 */}
        {categories.slice(4, 8).map(category => (
          <Link
            href={`/products/${category.slug}`}
            key={category.name}
            className="group relative mx-0.5 my-1 aspect-square bg-gray-300"
          >
            <Image
              src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${category.image}`}
              fill
              alt={category.name}
              className="object-cover"
            />

            <div className="absolute bottom-4 right-4 opacity-0 transition-all group-hover:opacity-100">
              {category.name}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
