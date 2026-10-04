'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';

import HlsVideo from '@/components/shared/hls-video';

gsap.registerPlugin(ScrollTrigger);

/**
 * انتخاب نسخه موبایل/دسکتاپ با همان بریک‌پوینتی که انیمیشن GSAP
 * استفاده می‌کند (768px) و بر اساس عرض واقعی پنجره — نه User-Agent.
 *
 * قبلاً با User-Agent تصمیم گرفته می‌شد که روی تبلت/اندروید با
 * نمایشگر بزرگ، نسخه اشتباه (و چه بسا ویدیوی 4K) دانلود می‌شد.
 */
export default function EndVideo() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');

    const update = () => setIsMobile(query.matches);

    update();
    query.addEventListener('change', update);

    return () => query.removeEventListener('change', update);
  }, []);

  useGSAP(() => {
    if (!sectionRef.current) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 768px)', () => {
      gsap.to(sectionRef.current, {
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 52px',
          end: '+=500',
          scrub: 0.5,
          pin: true,
        },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      mm.revert();
    };
  }, []);

  return (
    <div
      ref={sectionRef}
      className="aspect-6/7 sm:aspect-auto sm:h-screen w-full overflow-hidden relative mt-5 sm:mt-0 bg-black"
    >
      {isMobile !== null && (
        <HlsVideo
          key={isMobile ? 'mobile' : 'desktop'}
          src={
            isMobile ? '/home/mobile_end/master.m3u8' : '/home/end/master.m3u8'
          }
          poster={
            isMobile
              ? '/home/mobile_end/poster.webp'
              : '/home/end/poster.webp'
          }
          preload="metadata"
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
