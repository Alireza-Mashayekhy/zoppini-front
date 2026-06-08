// use-horizontal-scroll.ts
'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RefObject, useCallback, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

export function useHorizontalScroll(
  containerRef: RefObject<HTMLDivElement | null>,
  trackRef: RefObject<HTMLDivElement | null>,
  onActiveIndexChange?: (index: number | null) => void,
) {
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const cardTargetXRef = useRef<number[]>([]);

  // محاسبه موقعیت x مورد نیاز برای مرکزیت هر کارت
  const calculateCardTargets = useCallback(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return null;

    const cards = track.querySelectorAll<HTMLElement>('.category-card');
    if (cards.length === 0) return null;

    const containerRect = container.getBoundingClientRect();
    const containerCenterRelative = containerRect.width / 2;
    const cardCentersRelative: number[] = [];

    cards.forEach(card => {
      const cardRect = card.getBoundingClientRect();
      const cardCenterRelative =
        cardRect.left + cardRect.width / 2 - containerRect.left;
      cardCentersRelative.push(cardCenterRelative);
    });

    // x مورد نیاز برای انتقال هر کارت به مرکز = containerCenterRelative - cardCenterRelative
    const targetXForEach = cardCentersRelative.map(
      center => containerCenterRelative - center,
    );
    const startX = targetXForEach[0];
    const endX = targetXForEach[targetXForEach.length - 1];

    return { startX, endX, targetXForEach };
  }, [containerRef, trackRef]);

  // به‌روزرسانی ایندکس بر اساس مقدار x فعلی track
  const updateActiveIndexFromX = useCallback(
    (currentX: number) => {
      if (!onActiveIndexChange) return;
      const targets = cardTargetXRef.current;
      if (targets.length === 0) return;

      let minDist = Infinity;
      let closest = -1;
      for (let i = 0; i < targets.length; i++) {
        const dist = Math.abs(currentX - targets[i]);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      }
      onActiveIndexChange(closest !== -1 ? closest : null);
    },
    [onActiveIndexChange],
  );

  // راه‌اندازی اسکرول
  const setupScroll = useCallback(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const result = calculateCardTargets();
    if (!result) return;

    const { startX, endX, targetXForEach } = result;
    cardTargetXRef.current = targetXForEach;
    const scrollDistance = Math.abs(endX - startX);

    // پاکسازی قبلی
    if (tweenRef.current) {
      tweenRef.current.kill();
      tweenRef.current = null;
    }
    if (triggerRef.current) {
      triggerRef.current.kill();
      triggerRef.current = null;
    }

    // موقعیت اولیه
    gsap.set(track, { x: startX });
    // خواندن مقدار واقعی اولیه (به دلیل rounded ممکن است)
    const initialX = parseFloat(gsap.getProperty(track, 'x') as string);
    updateActiveIndexFromX(initialX);

    // ساخت تویین
    const tween = gsap.fromTo(
      track,
      { x: startX },
      {
        x: endX,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: () => `+=${scrollDistance}`,
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: () => {
            // دریافت مقدار فعلی x از track
            const currentX = parseFloat(gsap.getProperty(track, 'x') as string);
            updateActiveIndexFromX(currentX);
          },
        },
      },
    );

    tweenRef.current = tween;
    triggerRef.current = tween.scrollTrigger as ScrollTrigger;
    ScrollTrigger.refresh();
  }, [containerRef, trackRef, calculateCardTargets, updateActiveIndexFromX]);

  useGSAP(() => {
    setupScroll();

    const handleResize = () => {
      setupScroll();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (tweenRef.current) tweenRef.current.kill();
      if (triggerRef.current) triggerRef.current.kill();
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [setupScroll]);
}
