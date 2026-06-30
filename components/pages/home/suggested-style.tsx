'use client';

import 'keen-slider/keen-slider.min.css';

import { useKeenSlider } from 'keen-slider/react';
import Image from 'next/image';
import Link from 'next/link';

import LuxuryTitle from '@/components/shared/luxury-title';
import { FeaturedProductResponse } from '@/services/features/products/type';

export default function SuggestedStyle({
  products,
}: {
  products: FeaturedProductResponse[];
}) {
  const [sliderRef] = useKeenSlider({
    rtl: true,
    breakpoints: {
      '(min-width: 640px)': {
        slides: { perView: 2.5, spacing: 2 },
      },
      '(min-width: 1024px)': {
        slides: { perView: 3.5, spacing: 2 },
      },
    },
    slides: {
      perView: 1.5,
      spacing: 2,
    },
  });

  return (
    <div className=" h-screen space-y-5 my-10 overflow-hidden">
      <LuxuryTitle>پیشنهاد استایل</LuxuryTitle>
      <div ref={sliderRef} className="keen-slider h-[calc(100vh-100px)]">
        <div className="keen-slider__slide">
          <video muted loop autoPlay className="w-full h-full object-cover">
            <source src="/home/style.mp4" type="video/mp4" />
          </video>
        </div>
        {products.map(product => {
          const colorImage = product.product.colorImages?.find(
            img => img?.color?.id === product?.colorId,
          );
          const image = colorImage?.url || '';
          return (
            <Link
              href={`/product/${product.product.slug}`}
              key={product?.id}
              className="keen-slider__slide flex flex-col"
            >
              <div className="relative w-full h-full">
                <Image
                  src={process.env.NEXT_PUBLIC_IMAGE_URL + image}
                  fill
                  alt={product.product.title}
                  className="object-cover"
                />
              </div>
              <div className="w-full text-center bg-primary/70 p-4">
                {product.product.title}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
