'use client';
import Image from 'next/image';

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
          src="/home/5 (5).jpg"
          fill
          alt="image category 1"
          objectFit="cover"
        />
      </div>
      <div className="relative col-span-2 aspect-square">
        <Image
          src="/home/5 (5).jpg"
          fill
          alt="image category 1"
          objectFit="cover"
        />
      </div>
      {categories.slice(0, 4).map(category => (
        <div
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
        </div>
      ))}
      <div className="relative col-span-2 aspect-square">
        <video muted loop autoPlay className="w-full h-full object-cover">
          <source
            src="https://diorama.dam-broadcast.com/pm_11872_1348_1348692-h5jjxm7bx5-h265.mp4"
            type="video/mp4"
          />
        </video>
      </div>
      <div className="relative col-span-2 aspect-square">
        <video muted loop autoPlay className="w-full h-full object-cover">
          <source
            src="https://diorama.dam-broadcast.com/pm_11872_1348_1348692-h5jjxm7bx5-h265.mp4"
            type="video/mp4"
          />
        </video>
      </div>
      {categories.slice(4, 8).map(category => (
        <div
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
        </div>
      ))}
    </section>
  );
}
