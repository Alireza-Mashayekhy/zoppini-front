'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function InvitationPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen flex justify-center items-center overflow-hidden bg-black">
      {/* Desktop */}
      <div
        className={`
          hidden sm:block
          transition-all duration-[1800ms] ease-out
          ${
            isLoaded
              ? 'scale-100 opacity-100 blur-0'
              : 'scale-[1.08] opacity-0 blur-xl'
          }
        `}
      >
        <Image
          src="/invitation/desktop.webp"
          alt="desktop invitation"
          width={2560}
          height={2049}
          priority
          className="mx-auto h-screen w-auto object-cover"
        />
      </div>

      {/* Mobile */}
      <div
        className={`
          sm:hidden
          transition-all duration-[1800ms] ease-out
          ${
            isLoaded
              ? 'scale-100 opacity-100 blur-0'
              : 'scale-[1.08] opacity-0 blur-xl'
          }
        `}
      >
        <Image
          src="/invitation/mobile.webp"
          alt="mobile invitation"
          width={2560}
          height={2049}
          priority
          className="mx-auto h-auto w-full object-cover"
        />
      </div>
    </div>
  );
}
