import localFont from 'next/font/local';

export const iranSans = localFont({
  src: [
    // woff
    {
      path: './Tahrir_Pro/Web Fonts/woff/Tahrir_Regular.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: './Tahrir_Pro/Web Fonts/woff/Tahrir_Medium.woff',
      weight: '500',
      style: 'normal',
    },
    {
      path: './Tahrir_Pro/Web Fonts/woff/Tahrir_Bold.woff',
      weight: '700',
      style: 'normal',
    },
  ],
});
