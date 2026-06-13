'use client';

import 'keen-slider/keen-slider.min.css';

import { useKeenSlider } from 'keen-slider/react';
import Image from 'next/image';

export default function SuggestedStyle() {
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
    <div ref={sliderRef} className="keen-slider h-screen">
      <div className="keen-slider__slide">
        <video muted loop autoPlay className="w-full h-full object-cover">
          <source
            src="https://diorama.dam-broadcast.com/pm_11872_1348_1348692-h5jjxm7bx5-h265.mp4"
            type="video/mp4"
          />
        </video>
      </div>
      {[1, 2, 3, 4, 5].map(product => (
        <div key={product} className="keen-slider__slide flex flex-col">
          <div className="relative w-full h-full">
            <Image
              src={'/home/5 (5).jpg'}
              fill
              alt="پیراهن"
              className="object-cover"
            />
          </div>
          <div className="w-full text-center bg-primary/70 p-4">پیراهن</div>
        </div>
      ))}
    </div>
  );
}
