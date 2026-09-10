'use client';

import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import DirectionsMenu from './direction';

export interface InformationCardProps {
  name: string;
  address: string;
  phoneDisplay: string;
  phoneHref: string;
  image: string;
  lat: number;
  lng: number;
  className?: string;
}

export default function InformationCard({
  name,
  address,
  phoneDisplay,
  phoneHref,
  image,
  lat,
  lng,
  className,
}: InformationCardProps) {
  return (
    <div
      dir="rtl"
      className={cn(
        'flex w-full flex-col sm:flex-row overflow-hidden rounded-[30px] bg-gray-200',
        className,
      )}
    >
      {/* تصویر شعبه */}
      <div className="relative aspect-square w-full shrink-0 sm:w-2/5">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(min-width: 640px) 40vw, 100vw"
          className="object-cover rounded-[30px]"
        />
      </div>

      {/* اطلاعات شعبه */}
      <div className="flex flex-1 flex-col justify-center gap-4 p-6 sm:p-8">
        <h3 className="text-xl font-semibold text-neutral-800">{name}</h3>

        <p className="text-sm leading-relaxed text-neutral-500">{address}</p>

        <p className="text-sm text-neutral-500">
          <span className="text-neutral-400">شماره تماس: </span>
          <span dir="ltr" className="inline-block">
            {phoneDisplay}
          </span>
        </p>

        <div className="flex flex-col gap-2">
          <DirectionsMenu lat={lat} lng={lng} />

          <Button
            asChild
            size="lg"
            className="w-full justify-center rounded-[8px]! bg-[#C96115] text-white shadow-sm transition-all hover:bg-orange-800! hover:shadow-md"
          >
            <a href={`tel:${phoneHref}`}>تماس با شعبه</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
