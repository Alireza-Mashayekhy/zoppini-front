'use client';

import Image from 'next/image';
import { useState } from 'react';

import { cn } from '@/lib/utils';

interface CubeImageCarouselProps {
  images: [string, string, string, string];
  className?: string;
  alt?: string;
}

export default function CubeImageCarousel({
  images,
  className,
  alt = 'Product image',
}: CubeImageCarouselProps) {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div
      tabIndex={0}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={cn(
        'group relative my-8 aspect-square w-[300px] outline-none',
        className,
      )}
      style={{
        perspective: '900px',
      }}
    >
      {/* Cube */}
      <div
        className={cn('absolute inset-0', 'cube-3d', isPaused && 'cube-paused')}
      >
        {/* Front */}
        <CubeFace
          src={images[0]}
          alt={alt}
          transform="rotateY(0deg) translateZ(150px)"
        />

        {/* Right */}
        <CubeFace
          src={images[1]}
          alt={alt}
          transform="rotateY(90deg) translateZ(150px)"
        />

        {/* Back */}
        <CubeFace
          src={images[2]}
          alt={alt}
          transform="rotateY(180deg) translateZ(150px)"
        />

        {/* Left */}
        <CubeFace
          src={images[3]}
          alt={alt}
          transform="rotateY(-90deg) translateZ(150px)"
        />
      </div>

      <style jsx>{`
        .cube-3d {
          width: 100%;
          height: 100%;
          position: absolute;
          transform-style: preserve-3d;
          animation: cubeRotate 12s infinite ease-in-out;
          will-change: transform;
        }

        .cube-paused {
          animation-play-state: paused !important;
        }

        @keyframes cubeRotate {
          0% {
            transform: rotateY(0deg);
          }

          20% {
            transform: rotateY(0deg);
          }

          25% {
            transform: rotateY(-90deg);
          }

          45% {
            transform: rotateY(-90deg);
          }

          50% {
            transform: rotateY(-180deg);
          }

          70% {
            transform: rotateY(-180deg);
          }

          75% {
            transform: rotateY(-270deg);
          }

          95% {
            transform: rotateY(-270deg);
          }

          100% {
            transform: rotateY(-360deg);
          }
        }
      `}</style>
    </div>
  );
}

function CubeFace({
  src,
  alt,
  transform,
}: {
  src: string;
  alt: string;
  transform: string;
}) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        transform,
        backfaceVisibility: 'hidden',
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="300px"
        className="object-cover"
        priority
      />
    </div>
  );
}
