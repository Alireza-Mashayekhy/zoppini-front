'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger);

type Props = {
  title: string;
  image: string;
  isActive?: boolean;
};

export default function CategoryCard({ title, image, isActive }: Props) {
  return (
    <div
      className={`
      relative shrink-0 w-[420px] h-[60%] rounded-3xl overflow-hidden category-card
      transition-all duration-500 will-change-transform flex flex-col gap-8 p-5
      ${isActive ? 'z-10 bg-primary/20' : 'opacity-80'}
    `}
    >
      <div className="relative h-full">
        <Image
          src={image}
          alt={title}
          fill
          className={`object-cover transition-transform duration-700 ${isActive && 'rotate-12 scale-110'}`}
        />
      </div>

      <div className="relative">
        <h3 className={`text-3xl font-bold transition-all`}>{title}</h3>

        <span
          className={`mt-2 block h-[3px] w-16 bg-primary origin-center scale-x-0 transition-all duration-1000 ${isActive && 'scale-x-100'}`}
        />
      </div>
    </div>
  );
}
