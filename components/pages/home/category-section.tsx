'use client';

import { useRef, useState } from 'react';

import CategoryCard from '@/components/shared/category-card';
import { useHorizontalScroll } from '@/hooks/use-horizontal-scroll';

const categories = [
  {
    title: 'پیراهن',
    image: '/home/dress.png',
  },
  {
    title: 'پیراهن',
    image: '/home/dress.png',
  },
  {
    title: 'پیراهن',
    image: '/home/dress.png',
  },
  {
    title: 'پیراهن',
    image: '/home/dress.png',
  },
  {
    title: 'پیراهن',
    image: '/home/dress.png',
  },
  {
    title: 'پیراهن',
    image: '/home/dress.png',
  },
  {
    title: 'پیراهن',
    image: '/home/dress.png',
  },
  {
    title: 'پیراهن',
    image: '/home/dress.png',
  },
  {
    title: 'پیراهن',
    image: '/home/dress.png',
  },
  {
    title: 'پیراهن',
    image: '/home/dress.png',
  },
  {
    title: 'پیراهن',
    image: '/home/dress.png',
  },
];

export default function CategoriesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useHorizontalScroll(containerRef, trackRef, setActiveIndex);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen overflow-x-hidden"
    >
      <div ref={trackRef} className="flex w-max gap-6 items-center h-full px-8">
        {categories.map((item, index) => (
          <CategoryCard
            key={item.title + index}
            title={item.title}
            image={item.image}
            isActive={activeIndex === index}
          />
        ))}
      </div>
    </section>
  );
}
