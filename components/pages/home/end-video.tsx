'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

export default function EndVideo() {
  const sectionRef = useRef<HTMLDivElement>(null);

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
      className="aspect-6/7 sm:aspect-auto sm:h-screen w-full overflow-hidden relative mt-5 sm:mt-0"
    >
      <video
        muted
        loop
        autoPlay
        className="w-full h-full object-cover hidden sm:block"
      >
        <source src="/home/end.mp4" type="video/mp4" />
      </video>

      <video
        muted
        loop
        autoPlay
        className="w-full h-full object-cover block sm:hidden"
      >
        <source src="/home/mobile_end.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
