'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const products = [
  { name: 'لینن کالکشن', link: '/' },
  { name: 'کت تک', link: '/' },
  { name: 'پیراهن', link: '/' },
  { name: 'شلوار', link: '/' },
  { name: 'اسنیکرز', link: '/' },
  { name: 'پولوشرت', link: '/' },
  { name: 'تخته نرد', link: '/' },
  { name: 'شلوارک', link: '/' },
  { name: 'کالج', link: '/' },
  { name: 'تی شرت', link: '/' },
  { name: 'شکت و روپوش', link: '/' },
  { name: 'کفش آکسفورد', link: '/' },
];

gsap.registerPlugin(ScrollTrigger);

export default function HeroSection() {
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isPlaying1, setIsPlaying1] = useState(false);
  const [isPlaying2, setIsPlaying2] = useState(false);

  // تنظیمات اولیه ویدیو
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
    };

    prepareVideo(video1Ref.current);
    prepareVideo(video2Ref.current);
  }, []);

  useGSAP(() => {
    if (!productsRef.current) return;

    // تایم‌لاین انیمیشن که توسط اسکرول کنترل می‌شود
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=1000', // تا زمانی که بخش ناپدید شود
        scrub: 0.5, // انیمیشن نرم به همراه اسکرول
        pin: true, // محتوای اصلی در جای خود ثابت می‌ماند
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: self => {
          // اگر اسکرول به انتها رسید، می‌توانید سکشن بعدی را صدا بزنید
          if (self.progress === 1) {
            const nextSection = sectionRef.current?.nextElementSibling;
            if (nextSection) {
              nextSection.scrollIntoView({ behavior: 'smooth' });
            }
          }
          // اگر اسکرول به ابتدا برگشت، می‌توانید سکشن قبلی را صدا بزنید
          if (self.progress === 0 && self.direction === -1) {
            const prevSection = sectionRef.current?.previousElementSibling;
            if (prevSection) {
              prevSection.scrollIntoView({ behavior: 'smooth' });
            }
          }
        },
      },
    });

    // انیمیشن حرکت لیست از پایین به بالا
    tl.from(productsRef.current, {
      yPercent: 120,
      duration: 1,
      ease: 'power2.out',
    });

    // می‌توانید انیمیشن‌های بیشتری را در اینجا به تایم‌لاین اضافه کنید

    return () => {
      // کشتن تمام ScrollTrigger ها هنگام unmount
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const handleMouseEnter = (
    active: HTMLVideoElement | null,
    other: HTMLVideoElement | null,
    setActivePlaying: (val: boolean) => void,
    setOtherPlaying: (val: boolean) => void,
  ) => {
    if (!active) return;
    if (other && !other.paused) {
      other.pause();
      setOtherPlaying(false);
    }
    if (active.paused) {
      active.play().catch(e => console.warn(e));
      setActivePlaying(true);
    }
  };

  const onPlay1 = () => setIsPlaying1(true);
  const onPause1 = () => setIsPlaying1(false);
  const onPlay2 = () => setIsPlaying2(true);
  const onPause2 = () => setIsPlaying2(false);

  return (
    <div ref={sectionRef} className="relative h-screen overflow-hidden">
      <div className="grid grid-cols-2 h-full">
        {/* ویدیو راست */}
        <div className="relative h-full overflow-hidden bg-black">
          <video
            ref={video1Ref}
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            onMouseEnter={() =>
              handleMouseEnter(
                video1Ref.current,
                video2Ref.current,
                setIsPlaying1,
                setIsPlaying2,
              )
            }
            onPlay={onPlay1}
            onPause={onPause1}
          >
            <source
              src="https://diorama.dam-broadcast.com/pm_11872_1348_1348692-h5jjxm7bx5-h265.mp4"
              type="video/mp4"
            />
          </video>
          <div
            className={`absolute inset-0 pointer-events-none transition-all ${!isPlaying1 ? 'bg-black/70' : 'bg-black/0'}`}
          />
        </div>

        {/* ویدیو چپ */}
        <div className="relative h-full overflow-hidden bg-black">
          <video
            ref={video2Ref}
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            onMouseEnter={() =>
              handleMouseEnter(
                video2Ref.current,
                video1Ref.current,
                setIsPlaying2,
                setIsPlaying1,
              )
            }
            onPlay={onPlay2}
            onPause={onPause2}
          >
            <source
              src="https://diorama.dam-broadcast.com/pm_11872_1348_1348692-h5jjxm7bx5-h265.mp4"
              type="video/mp4"
            />
          </video>
          <div
            className={`absolute inset-0 pointer-events-none transition-all ${!isPlaying2 ? 'bg-black/70' : 'bg-black/0'}`}
          />
        </div>
      </div>

      {/* عنوان مرکزی */}
      <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-5xl text-shadow-lg z-10">
        Zoopini
      </h1>

      {/* لیست محصولات */}
      <div
        ref={productsRef}
        className="absolute bottom-0 right-0 m-6 z-20 text-white font-sans flex flex-col gap-2 text-right"
      >
        {products.map((product, idx) => (
          <Link
            href={product.link}
            key={idx}
            className="relative inline-block overflow-hidden py-1 text-xl font-semibold text-shadow-lg rounded-lg group"
          >
            <span className="block transition-transform duration-300 group-hover:translate-y-[-110%]">
              {product.name}
            </span>
            <span className="absolute inset-0 block transition-transform duration-300 translate-y-full group-hover:translate-y-0">
              {product.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
