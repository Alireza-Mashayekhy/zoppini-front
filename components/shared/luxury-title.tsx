'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

// ثبت پلاگین ScrollTrigger (فقط یک بار در کل برنامه)
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LuxuryTitle({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const titleRef = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    // اگر المان‌ها موجود نباشند، کاری نکن
    if (!titleRef.current || !lineRef.current) return;

    // ایجاد انیمیشن با ScrollTrigger
    const ctx = gsap.context(() => {
      // انیمیشن عنوان
      gsap.fromTo(
        titleRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 85%', // وقتی 85% از بالای ویوپورت به trigger برسد
            toggleActions: 'play none none reverse', // پخش هنگام ورود، ریورس هنگام خروج
            // اگر می‌خواهید فقط یک بار اجرا شود: toggleActions: 'play none none none'
          },
        },
      );

      // انیمیشن خط طلایی
      gsap.fromTo(
        lineRef.current,
        { width: 0, opacity: 0 },
        {
          width: '80px',
          opacity: 1,
          duration: 0.8,
          delay: 0.3,
          ease: 'back.out(1)',
          scrollTrigger: {
            trigger: lineRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        },
      );
    });

    // پاکسازی انیمیشن‌ها هنگام unmount
    return () => ctx.revert();
  }, []);

  return (
    <div className={`relative ${className}`}>
      <h2
        ref={titleRef}
        className="text-2xl font-semibold tracking-wide text-gray-800"
      >
        {children}
      </h2>
      <div className="flex justify-start mt-2">
        <div
          ref={lineRef}
          className="h-0.5 bg-linear-to-r from-amber-400 to-amber-600 rounded-full"
        />
      </div>
    </div>
  );
}
