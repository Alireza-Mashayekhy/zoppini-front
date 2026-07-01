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

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div ref={sectionRef} className="h-screen w-full overflow-hidden relative">
      <video muted loop autoPlay className="w-full h-full object-cover">
        <source src="/home/end.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
