'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import HlsVideo from '@/components/shared/hls-video';
import { CategoriesResponse } from '@/services/features/categories/types';

interface HeroSectionProps {
  categories: CategoriesResponse[];

  // ref مربوط به لیست دسته بندی ها
  categoriesRef: React.RefObject<HTMLDivElement | null>;
}

export default function HeroSection(
  {
    // categories,
    // categoriesRef,
  }: HeroSectionProps,
) {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  const [isPlaying1, setIsPlaying1] = useState(false);
  const [isPlaying2, setIsPlaying2] = useState(false);

  useEffect(() => {
    const prepareVideo = (video: HTMLVideoElement | null) => {
      if (!video) return;

      const onCanPlay = () => {
        video.currentTime = 0;
        video.pause();

        video.removeEventListener('canplaythrough', onCanPlay);
      };

      video.addEventListener('canplaythrough', onCanPlay);

      video.load();

      return () => {
        video.removeEventListener('canplaythrough', onCanPlay);
      };
    };

    const cleanupVideo1 = prepareVideo(video1Ref.current);
    const cleanupVideo2 = prepareVideo(video2Ref.current);

    return () => {
      cleanupVideo1?.();
      cleanupVideo2?.();
    };
  }, []);

  const handleMouseEnter = (
    active: HTMLVideoElement | null,
    other: HTMLVideoElement | null,
    setActivePlaying: (value: boolean) => void,
    setOtherPlaying: (value: boolean) => void,
  ) => {
    if (!active) return;

    if (other && !other.paused) {
      other.pause();
      setOtherPlaying(false);
    }

    if (active.paused) {
      active.play().catch(error => {
        console.warn('Video play error:', error);
      });

      setActivePlaying(true);
    }
  };

  return (
    <section className="relative h-full overflow-hidden">
      <h1 className="sr-only">
        فروشگاه آنلاین پوشاک مردانه زوپینی - کت شلوار، پالتو و پیراهن مردانه
      </h1>
      {/* Videos */}
      <div className="grid h-full grid-cols-1 sm:grid-cols-2">
        {/* Video 1 */}
        <div className="relative h-full overflow-hidden bg-black">
          <HlsVideo
            ref={video1Ref}
            src="/home/hero_section_1/master.m3u8"
            muted
            loop
            playsInline
            lowQualityFirst
            className="h-full w-full object-cover"
            onMouseEnter={() =>
              handleMouseEnter(
                video1Ref.current,
                video2Ref.current,
                setIsPlaying1,
                setIsPlaying2,
              )
            }
            onTouchStart={() =>
              handleMouseEnter(
                video1Ref.current,
                video2Ref.current,
                setIsPlaying1,
                setIsPlaying2,
              )
            }
            onPlay={() => setIsPlaying1(true)}
            onPause={() => setIsPlaying1(false)}
          />

          <div
            className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
              !isPlaying1 ? 'bg-black/70' : 'bg-black/0'
            }`}
          />
        </div>

        {/* Video 2 */}
        <div className="relative h-full overflow-hidden bg-black">
          <HlsVideo
            ref={video2Ref}
            src="/home/hero_section_2/master.m3u8"
            muted
            loop
            playsInline
            lowQualityFirst
            className="h-full w-full object-cover"
            onMouseEnter={() =>
              handleMouseEnter(
                video2Ref.current,
                video1Ref.current,
                setIsPlaying2,
                setIsPlaying1,
              )
            }
            onTouchStart={() =>
              handleMouseEnter(
                video2Ref.current,
                video1Ref.current,
                setIsPlaying2,
                setIsPlaying1,
              )
            }
            onPlay={() => setIsPlaying2(true)}
            onPause={() => setIsPlaying2(false)}
          />

          <div
            className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
              !isPlaying2 ? 'bg-black/70' : 'bg-black/0'
            }`}
          />
        </div>
      </div>

      {/* Logo */}
      <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <Image
          src="/logo/white-logo.png"
          width={200}
          height={30}
          alt="زوپینی"
        />
      </div>

      {/* Hero Categories */}
      {/* <div
        ref={categoriesRef}
        className="absolute bottom-0 right-0 z-20 m-6 flex flex-col gap-2 text-right font-sans text-white"
      >
        {categories.map(category => (
          <Link
            href={`/products/${category.slug}`}
            key={category.id}
            className="group relative inline-block overflow-hidden rounded-lg py-1 text-xl font-semibold text-shadow-lg"
          >
            <span className="block transition-transform duration-300 group-hover:-translate-y-[110%]">
              {category.name}
            </span>

            <span className="absolute inset-0 block translate-y-full transition-transform duration-300 group-hover:translate-y-0">
              {category.name}
            </span>
          </Link>
        ))}
      </div> */}
    </section>
  );
}
