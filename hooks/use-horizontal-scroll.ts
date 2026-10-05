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
  const cardTargetXRef = useRef<number[]>([]);

  const calculateCardTargets = useCallback(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return null;

    const cards = track.querySelectorAll<HTMLElement>('.category-card');
    if (cards.length === 0) return null;

    const containerRect = container.getBoundingClientRect();
    const containerCenterRelative = containerRect.width / 2;

    const currentX = Number(gsap.getProperty(track, 'x')) || 0;

    const targetXForEach: number[] = [];

    cards.forEach(card => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter =
        cardRect.left + cardRect.width / 2 - containerRect.left - currentX;
      targetXForEach.push(containerCenterRelative - cardCenter);
    });

    const startX = targetXForEach[0];
    const endX = targetXForEach[targetXForEach.length - 1];

    return { startX, endX, targetXForEach };
  }, [containerRef, trackRef]);

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

  useGSAP(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const targets = calculateCardTargets();
    if (!targets) return;

    cardTargetXRef.current = targets.targetXForEach;

    const getStartX = () => calculateCardTargets()?.startX ?? 0;
    const getEndX = () => calculateCardTargets()?.endX ?? 0;
    const getScrollDistance = () => Math.abs(getEndX() - getStartX()) || 1;

    const tween = gsap.fromTo(
      track,
      { x: getStartX },
      {
        x: getEndX,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top top',
          end: () => `+=${getScrollDistance()}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: () => {
            const next = calculateCardTargets();
            cardTargetXRef.current = next?.targetXForEach ?? [];
          },
          onUpdate: () => {
            // دریافت مقدار فعلی x از track
            const currentX = Number(gsap.getProperty(track, 'x')) || 0;
            updateActiveIndexFromX(currentX);
          },
        },
      },
    );

    updateActiveIndexFromX(getStartX());

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [containerRef, trackRef, calculateCardTargets, updateActiveIndexFromX]);
}
