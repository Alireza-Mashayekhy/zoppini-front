'use client';
import Image from 'next/image';
import Link from 'next/link';

import { CategoriesResponse } from '@/services/features/categories/types';

export default function CategoriesSection({
  categories,
}: {
  categories: CategoriesResponse[];
}) {
  return (
    <section className="relative grid grid-cols-4">
      <div className="relative col-span-2 aspect-square">
        <Image
          src="/home/category_1.jpg"
          fill
          alt="image category 1"
          objectFit="cover"
        />
      </div>
      <div className="relative col-span-2 aspect-square">
        <Image
          src="/home/category_2.jpg"
          fill
          alt="image category 1"
          objectFit="cover"
        />
      </div>
      {categories.slice(0, 4).map(category => (
        <Link
          href={'/products/' + category.slug}
          key={category.name}
          className="aspect-square relative my-1 mx-0.5 group bg-gray-300"
        >
          <Image
            src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${category.image}`}
            fill
            alt="image category 1"
            objectFit="cover"
            onError={err => console.log(err)}
          />
          <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all">
            {category.name}
          </div>
        </Link>
      ))}
      <div className="relative col-span-2 aspect-square">
        <video muted loop autoPlay className="w-full h-full object-cover">
          <source src="/home/category_1.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="relative col-span-2 aspect-square">
        <video muted loop autoPlay className="w-full h-full object-cover">
          <source src="/home/category_2.mp4" type="video/mp4" />
        </video>
      </div>
      {categories.slice(4, 8).map(category => (
        <Link
          href={'/products/' + category.slug}
          key={category.name}
          className="aspect-square relative my-1 mx-0.5 group bg-gray-300"
        >
          <Image
            src={process.env.NEXT_PUBLIC_IMAGE_URL + category.image}
            fill
            alt="image category 1"
            objectFit="cover"
          />
          <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all">
            {category.name}
          </div>
        </Link>
      ))}
    </section>
  );
}
