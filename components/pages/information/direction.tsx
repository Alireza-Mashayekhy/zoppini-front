'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface NavigationOption {
  label: string;
  description: string;
  icon: string;
  getUrl: (lat: number, lng: number) => string;
}

export const navigationOptions: NavigationOption[] = [
  {
    label: 'گوگل مپ',
    description: 'مسیریابی با Google Maps',
    icon: '/information/google.jpg',
    getUrl: (lat, lng) =>
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        `${lat},${lng}`,
      )}&travelmode=driving`,
  },

  {
    label: 'ویز',
    description: 'مسیریابی با Waze',
    icon: '/information/waze.webp',
    getUrl: (lat, lng) =>
      `https://waze.com/ul?ll=${encodeURIComponent(
        `${lat},${lng}`,
      )}&navigate=yes`,
  },

  {
    label: 'نشان',
    description: 'مسیریابی با نشان',
    icon: '/information/neshan.png',
    getUrl: (lat, lng) =>
      `https://neshan.org/maps/routing/car/destination/${encodeURIComponent(
        `${lat},${lng}`,
      )}#c35.661-51.493-10z-0p`,
  },

  {
    label: 'بلد',
    description: 'مسیریابی با بلد',
    icon: '/information/balad.webp',
    getUrl: (lat, lng) =>
      `https://balad.ir/directions/driving?destination=${encodeURIComponent(
        `${lng},${lat}`,
      )}`,
  },
];

interface DirectionsMenuProps {
  lat: number;
  lng: number;
  className?: string;
}

export default function DirectionsMenu({
  lat,
  lng,
  className,
}: DirectionsMenuProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className={
            className ??
            'w-full justify-center rounded-[8px]! bg-orange-700 text-white shadow-sm transition-all hover:bg-orange-800 hover:shadow-md'
          }
        >
          مسیریابی
        </Button>
      </DialogTrigger>

      <DialogContent
        dir="rtl"
        className="w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-3xl p-0 sm:w-full"
      >
        <DialogHeader className="border-b bg-gradient-to-b from-orange-50 to-white px-6 pb-5 pt-6 text-right">
          <DialogTitle className="text-xl font-bold">
            انتخاب مسیریاب
          </DialogTitle>

          <DialogDescription className="mt-1 text-sm leading-6 text-gray-500">
            مسیریاب مورد نظر خود را انتخاب کنید تا مسیر این مکان برای شما باز
            شود.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-3 p-5">
          {navigationOptions.map(option => (
            <a
              key={option.label}
              href={option.getUrl(lat, lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              {/* Logo */}
              <div className="flex w-full aspect-square shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <img
                  src={option.icon}
                  alt={option.label}
                  className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
                />
              </div>
            </a>
          ))}
        </div>

        <div className="border-t bg-gray-50 px-5 py-4">
          <p className="text-center text-xs leading-5 text-gray-400">
            با انتخاب هر گزینه، مقصد در سرویس مسیریابی مربوطه باز خواهد شد.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
