import localFont from 'next/font/local';

export const iranSans = localFont({
  src: [
    {
      path: './estedad/woff2/Estedad-Medium.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './estedad/woff2/Estedad-Regular.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './estedad/woff2/Estedad-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: './estedad/woff2/Estedad-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
  fallback: ['Tahoma', 'Arial', 'sans-serif'],
});
