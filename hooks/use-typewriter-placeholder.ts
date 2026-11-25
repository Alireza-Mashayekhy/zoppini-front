'use client';

import { useEffect, useState } from 'react';

/**
 * متنی که به‌صورت تایپرایتر در `placeholder` المنت نمایش می‌شود.
 *
 * هر عبارت (مانند «جستجو در پیراهن مردانه…») کاراکتر به کاراکتر می‌نویسد،
 * کمی توقف می‌کند، سپس کاراکتر به کاراکتر پاک می‌شود و به عبارت بعدی
 * می‌رود. این متن فقط placeholder است؛ هرگز به‌صورت value المنت وارد نمی‌شود
 * و هیچ جستجوی اضافی فعال نمی‌کند.
 *
 * - هنگام فوکوس یا تایپ کاربر (`paused`)، انیمیشن متوقف می‌شود و متن کاربر
 *   حفظ می‌شود. هنگام بی‌فوکوس و خالی بودن، انیمیشن از نو شروع می‌شود.
 * - هنگام `prefers-reduced-motion: reduce`، یک هشدار ثابت فارسی نشان داده
 *   می‌شود و انیمیشن تکرار نمی‌شود.
 */
const STATIC_HINT = 'جستجو در محصولات…';

/** تایمِ کاراکتر به کاراکتر: جستجو در <دسته>… */
export function useTypewriterPlaceholder(
  phrases: string[],
  paused: boolean,
): string {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [text, setText] = useState(STATIC_HINT);

  // اگر کاربر سیستم‌عاملش را به «کم‌حرکت» تنظیم کرده، انیمیشن تکرار نمی‌شود.
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reduceMotion || paused) return;

    const list = phrases.filter(phrase => phrase.trim().length > 0);
    if (list.length === 0) return;

    let phraseIndex = 0;
    let charIndex = 0;
    let current = '';
    let erasing = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      if (paused || reduceMotion) return;

      const phrase = list[phraseIndex];

      if (!erasing) {
        if (charIndex < phrase.length) {
          current = phrase.slice(0, charIndex + 1);
          charIndex += 1;
          setText(current);
          timer = setTimeout(tick, 85);
        } else {
          erasing = true;
          timer = setTimeout(tick, 720);
        }
      } else if (current.length > 0) {
        current = current.slice(0, -1);
        setText(current);
        timer = setTimeout(tick, 42);
      } else {
        erasing = false;
        phraseIndex = (phraseIndex + 1) % list.length;
        charIndex = 0;
        timer = setTimeout(tick, 360);
      }
    };

    timer = setTimeout(tick, 360);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [reduceMotion, paused, phrases]);

  return reduceMotion ? STATIC_HINT : text;
}
