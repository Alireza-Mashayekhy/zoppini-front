'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

import HlsVideo from '@/components/shared/hls-video';
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

      const mm = gsap.matchMedia();

      // فقط دسکتاپ
      mm.add('(min-width: 768px)', () => {
        const firstSection = firstSectionRef.current!;
        const secondSection = secondSectionRef.current!;

        const firstSectionHeight = firstSection.offsetHeight;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrapperRef.current,

            start: `+=${firstSectionHeight} bottom`,
            end: '+=1600',

            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // مکث قبل از ورود بخش دوم
        tl.to({}, { duration: 0.5 });

        // ورود بخش دوم از پایین
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

        // مکث انتهایی
        tl.to({}, { duration: 0.2 });

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      // cleanup matchMedia
      return () => {
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
      className="relative w-full overflow-hidden bg-white"
    >
      {/* ============================================== */}
      {/* بخش اول */}
      {/* ============================================== */}

      <div
        ref={firstSectionRef}
        className="relative z-0 grid w-full grid-cols-2 bg-white sm:grid-cols-4"
      >
        {/* تصویر اول */}
        <div className="relative col-span-2 aspect-square hidden sm:block">
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

      {/* ============================================== */}
      {/* بخش دوم */}
      {/* ============================================== */}

      <div
        ref={secondSectionRef}
        className="relative grid w-full grid-cols-2 sm:grid-cols-4 bg-white sm:absolute sm:left-0 sm:top-0 sm:z-10"
      >
        {/* ویدیو اول */}
        <div className="relative col-span-2 aspect-square hidden sm:block">
          <HlsVideo
            src="/home/category_1/master.m3u8"
            className="h-full w-full object-cover"
          />
        </div>

        {/* ویدیو دوم */}
        <div className="relative col-span-2 aspect-square">
          <HlsVideo
            src="/home/category_2/master.m3u8"
            className="h-full w-full object-cover"
          />
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
