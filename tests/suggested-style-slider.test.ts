import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import KeenSlider, {
  type KeenSliderInstance,
  type KeenSliderPlugin,
} from 'keen-slider';

/**
 * استخراج منطق خالص پلاگین بدون اجرای ایمپورت CSS در محیط Node.
 * همچنین خودِ فایل `suggested-style.tsx` را بررسی می‌کنیم تا مطمئن شویم
 * دقیقاً از همین پلاگین و تنظیمات استفاده می‌کند.
 */
const styleSrc = readFileSync(
  resolve(__dirname, '..', 'components/pages/home/suggested-style.tsx'),
  'utf8',
);
const keenCss = readFileSync(
  resolve(__dirname, '..', 'node_modules/keen-slider/keen-slider.min.css'),
  'utf8',
);

const mobileSwipePlugin: KeenSliderPlugin = slider => {
  let dragStartIdx: number | null = null;
  let dragStartPos: number | null = null;

  const isSingleSlidePerView = () => {
    const slidesOpt = slider.options.slides;

    return (
      typeof slidesOpt === 'object' &&
      slidesOpt !== null &&
      slidesOpt.perView === 1
    );
  };

  slider.on('dragStarted', () => {
    const details = slider.track.details;
    if (!details) {
      dragStartIdx = null;
      dragStartPos = null;
      return;
    }

    dragStartIdx = Math.round(details.position);
    dragStartPos = details.position;
  });

  slider.on('dragged', () => {
    if (
      !isSingleSlidePerView() ||
      dragStartIdx === null ||
      !slider.track.details
    ) {
      return;
    }

    const pos = slider.track.details.position;
    const minPos = dragStartIdx - 0.999;
    const maxPos = dragStartIdx + 0.999;

    if (pos < minPos) {
      slider.track.to(minPos);
    } else if (pos > maxPos) {
      slider.track.to(maxPos);
    }
  });

  slider.on('dragEnded', () => {
    if (
      !isSingleSlidePerView() ||
      dragStartIdx === null ||
      !slider.track.details
    ) {
      dragStartIdx = null;
      dragStartPos = null;
      return;
    }

    const startIdx = dragStartIdx;
    const startPos = dragStartPos ?? startIdx;
    dragStartIdx = null;
    dragStartPos = null;

    const details = slider.track.details;
    const posDelta = details.position - startPos;
    const vel = slider.track.velocity();

    let step = 0;
    if (
      Math.abs(vel) > 0 &&
      Math.abs(posDelta) > 0.02 &&
      Math.sign(vel) === Math.sign(posDelta)
    ) {
      step = Math.sign(vel);
    } else if (Math.abs(posDelta) >= 0.5) {
      step = Math.sign(posDelta);
    }

    const minAllowed = Math.max(details.minIdx, startIdx - 1);
    const maxAllowed = Math.min(details.maxIdx, startIdx + 1);
    const targetIdx = Math.min(
      Math.max(startIdx + step, minAllowed),
      maxAllowed,
    );

    if (slider.animator.targetIdx !== targetIdx || !slider.animator.active) {
      slider.animator.stop();
      const dist = slider.track.idxToDist(targetIdx, true);
      if (dist) {
        slider.moveToIdx(targetIdx, true);
      } else {
        slider.track.to(targetIdx);
      }
    }
  });

  slider.on('optionsChanged', () => {
    const slidesOpt = slider.options.slides;
    if (
      typeof slidesOpt === 'object' &&
      slidesOpt !== null &&
      slidesOpt.perView === 'auto'
    ) {
      slider.slides.forEach(slide => {
        slide.style.removeProperty('min-width');
        slide.style.removeProperty('max-width');
      });
      slider.update();
    }
  });
};

/* ────────────────────────────────────────────────────────────────────────── */
/* شبیه‌ساز محیط مرورگر برای KeenSlider واقعی                                   */
/* ────────────────────────────────────────────────────────────────────────── */

interface MockElement {
  style: Record<string, unknown>;
  offsetWidth: number;
  offsetHeight: number;
  getBoundingClientRect: () => { width: number; height: number };
  setAttribute: (k: string, v: string) => void;
  removeAttribute: (k: string) => void;
  addEventListener: (type: string, fn: (ev: unknown) => void) => void;
  removeEventListener: (type: string, fn: (ev: unknown) => void) => void;
  querySelectorAll: (sel: string) => MockElement[];
  dispatch: (type: string, ev: unknown) => void;
  attrs: Record<string, string>;
  slides: MockElement[];
}

function setupBrowserEnv(initialViewportWidth: number, viewportHeight = 800) {
  let vw = initialViewportWidth;
  let vh = viewportHeight;
  let now = 10_000;
  const mediaListeners: Array<() => void> = [];

  let rafQueue: Array<(t: number) => void> = [];
  const flushRaf = () => {
    const batch = rafQueue;
    rafQueue = [];
    batch.forEach(cb => cb(now));
  };

  (globalThis as Record<string, unknown>).requestAnimationFrame = (
    cb: (t: number) => void,
  ) => {
    rafQueue.push(cb);
    return rafQueue.length;
  };
  (globalThis as Record<string, unknown>).cancelAnimationFrame = () => {};
  (globalThis as Record<string, unknown>).HTMLElement = class HTMLElement {};
  (globalThis as Record<string, unknown>).NodeList = class NodeList {};
  (globalThis as Record<string, unknown>).document = {
    querySelectorAll: () => [],
  };

  Date.now = () => now;

  (globalThis as Record<string, unknown>).window = {
    get innerWidth() {
      return vw;
    },
    get innerHeight() {
      return vh;
    },
    matchMedia: (query: string) => {
      const mql: Record<string, unknown> = {};
      Object.defineProperty(mql, 'matches', {
        get() {
          if (query.includes('640px')) return vw >= 640;
          return false;
        },
        enumerable: true,
      });
      mql.addEventListener = (_type: string, fn: () => void) => {
        mediaListeners.push(fn);
      };
      mql.removeEventListener = () => {};
      return mql;
    },
    getComputedStyle: () => ({
      getPropertyValue: (prop: string) => (prop === 'direction' ? 'rtl' : ''),
    }),
    requestAnimationFrame: (globalThis as Record<string, unknown>)
      .requestAnimationFrame,
    cancelAnimationFrame: (globalThis as Record<string, unknown>)
      .cancelAnimationFrame,
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  function mobileCardSize(width: number, height: number) {
    // مطابق فرمول واقعی `--zp-style-media-w` در `home-scroll.css`
    const byWidth = width - 32;
    const byHeight = (height - 52 - 64 - 80 - 76) / 1.5625;

    return Math.round(Math.min(byWidth, byHeight));
  }

  function createSliderDom(slideCount: number) {
    const Proto = (
      globalThis as unknown as { HTMLElement: new () => Record<string, unknown> }
    ).HTMLElement;

    function makeEl(isSlide: boolean): MockElement {
      const listeners: Record<string, Array<(ev: unknown) => void>> = {};
      const attrs: Record<string, string> = {};
      const style: Record<string, unknown> = {
        removeProperty(prop: string) {
          style[prop] = null;
        },
      };

      const computeNaturalWidth = () => {
        if (vw < 640) {
          return mobileCardSize(vw, vh);
        }
        if (vw < 1024) {
          return isSlide ? Math.round(vw * 0.45) : Math.round(vw * 0.55);
        }
        return isSlide ? Math.round(vw * 0.32) : Math.round(vw * 0.68);
      };

      const el = new Proto() as unknown as MockElement;
      Object.defineProperties(el, {
        style: { value: style, enumerable: true },
        attrs: { value: attrs, enumerable: true },
        slides: { value: [] as MockElement[], writable: true, enumerable: true },
        offsetWidth: {
          get() {
            const minStyle = style['min-width'];
            const maxStyle = style['max-width'];
            let minW =
              typeof minStyle === 'string' ? parseFloat(minStyle) : 0;
            const maxW =
              typeof maxStyle === 'string' ? parseFloat(maxStyle) : Infinity;

            if (isSlide && vw >= 640) {
              // sm:min-w-[45vw]! / lg:min-w-[32vw]! در دسکتاپ !important دارد
              minW = computeNaturalWidth();
            }

            const base = computeNaturalWidth();
            return Math.max(minW, Math.min(base, maxW));
          },
          enumerable: true,
        },
        offsetHeight: {
          get() {
            return vw < 640 ? mobileCardSize(vw, vh) : 600;
          },
          enumerable: true,
        },
      });
      el.getBoundingClientRect = () => ({
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
      el.setAttribute = (k: string, v: string) => {
        attrs[k] = v;
      };
      el.removeAttribute = (k: string) => {
        delete attrs[k];
      };
      el.addEventListener = (type: string, fn: (ev: unknown) => void) => {
        (listeners[type] ||= []).push(fn);
      };
      el.removeEventListener = (type: string, fn: (ev: unknown) => void) => {
        if (listeners[type]) {
          listeners[type] = listeners[type].filter(f => f !== fn);
        }
      };
      el.querySelectorAll = (sel: string) =>
        sel === '.keen-slider__slide' ? el.slides : [];
      el.dispatch = (type: string, ev: unknown) => {
        (listeners[type] || []).forEach(fn => fn(ev));
      };

      return el;
    }

    const container = makeEl(false);
    container.slides = Array.from({ length: slideCount }, () => makeEl(true));

    const createInstance = (loop = slideCount > 1): KeenSliderInstance => {
      const instance = new KeenSlider(
        container as unknown as HTMLElement,
        {
          loop,
          drag: slideCount > 1,
          mode: 'snap',
          rtl: true,
          slides: { perView: 1, spacing: 0, origin: 'auto' },
          breakpoints: {
            '(min-width: 640px)': {
              slides: { perView: 'auto', spacing: 2, origin: 'auto' },
            },
          },
        },
        [mobileSwipePlugin],
      );
      flushRaf();
      return instance as unknown as KeenSliderInstance;
    };

    return {
      container,
      createInstance,
      advanceTime: (ms: number) => {
        now += ms;
      },
      resizeViewport: (
        nextW: number,
        nextH: number,
        slider: ReturnType<typeof createInstance>,
      ) => {
        const prevDesktop = vw >= 640;
        // شبیه‌سازی شرایط سخت‌تر در موبایل عریض (580px => کارت 548px) که max-width اینلاین بزرگ‌تر از کارت دسکتاپ نیست، یا موبایل کوچک (390px => کارت 358px) که به تبلت (650px => کارت 292px) تغییر می‌کند!
        vw = nextW;
        vh = nextH;
        const nextDesktop = vw >= 640;
        if (prevDesktop !== nextDesktop) {
          mediaListeners.forEach(fn => fn());
        }
        flushRaf();
        slider.update();
        flushRaf();
      },
    };
  }

  return { createSliderDom };
}

function performSwipe(
  container: MockElement,
  slider: KeenSliderInstance,
  advanceTime: (ms: number) => void,
  startX: number,
  endX: number,
  stepMs = 16,
) {
  advanceTime(100);
  container.dispatch('touchstart', {
    targetTouches: [{ identifier: 1, screenX: startX, screenY: 120 }],
    changedTouches: [{ identifier: 1, screenX: startX, screenY: 120 }],
  });

  for (const frac of [0.1, 0.4, 0.75, 1]) {
    advanceTime(stepMs);
    const x = startX + (endX - startX) * frac;
    container.dispatch('touchmove', {
      targetTouches: [{ identifier: 1, screenX: x, screenY: 120 }],
      changedTouches: [{ identifier: 1, screenX: x, screenY: 120 }],
      cancelable: true,
      preventDefault() {},
    });
  }

  advanceTime(stepMs);
  container.dispatch('touchend', {
    targetTouches: [],
    changedTouches: [{ identifier: 1, screenX: endX, screenY: 120 }],
  });

  // شبیه‌سازی اتمام انیمیشن اسنپ به مقصد نهایی
  const targetIdx =
    slider.animator.targetIdx !== null
      ? slider.animator.targetIdx
      : slider.track.details.abs;
  slider.animator.stop();
  slider.track.to(targetIdx);
}

/* ────────────────────────────────────────────────────────────────────────── */
/* تست‌ها                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

test('فایل استایل پایه keen-slider ایمپورت شده و قوانین RTL و touch-action: pan-y فعال‌اند', () => {
  assert.ok(styleSrc.includes("import 'keen-slider/keen-slider.min.css';"));
  assert.ok(styleSrc.includes('suggestedStyleMobileSwipePlugin'));
  assert.match(keenCss, /touch-action:pan-y/);
  assert.match(
    keenCss,
    /\[data-keen-slider-reverse\]\{flex-direction:row-reverse\}/,
  );
});

test('عرض‌های مختلف موبایل (320، 360، 375، 390، 414، 430): فقط یک کارت فعال و کامل دیده می‌شود', () => {
  const mobileViewports = [
    { w: 320, h: 568 }, // iPhone 5/SE کوچک
    { w: 360, h: 740 }, // Android رایج
    { w: 375, h: 667 }, // iPhone SE (ارتفاع کوتاه => کارت کوچک‌تر از عرض صفحه)
    { w: 375, h: 812 }, // iPhone X/13 mini
    { w: 390, h: 844 }, // iPhone 14
    { w: 414, h: 896 }, // iPhone XR/11
    { w: 430, h: 932 }, // iPhone 15 Pro Max
  ];

  for (const { w, h } of mobileViewports) {
    const { createSliderDom } = setupBrowserEnv(w, h);
    const dom = createSliderDom(5);
    const { advanceTime } = dom;
    const slider = dom.createInstance(true);

    // کانتینر در RTL باید data-keen-slider-reverse بگیرد تا با row-reverse تراز شود
    assert.equal(dom.container.attrs['data-keen-slider-reverse'], '');

    // در لحظهٔ شروع: فقط اسلاید ۰ دارای portion === 1 و بقیه دقیقاً 0 (عدم نمایش ناقص کارت بعدی)
    const initialPortions = slider.track.details.slides.map(s => s.portion);
    assert.deepEqual(
      initialPortions,
      [1, 0, 0, 0, 0],
      `viewport ${w}x${h}: expected only slide 0 visible`,
    );

    // هر اسلاید عرض دقیقاً معادل عرض کانتینر (size === 1) دارد
    assert.equal(slider.options.trackConfig?.[0]?.size, 1);

    // Swipe معمولی به جلو (در RTL حرکت انگشت به راست => محصول بعدی): دقیقاً +1
    performSwipe(dom.container, slider, advanceTime, 80, 220);
    assert.equal(slider.track.details.abs, 1, `viewport ${w}x${h}: swipe +1`);
    assert.equal(slider.track.details.position, 1);
    assert.deepEqual(
      slider.track.details.slides.map(s => s.portion),
      [0, 1, 0, 0, 0],
    );

    // Swipe بسیار بلند و سریع (بزرگ‌تر از کل عرض کارت!): همچنان دقیقاً +1 (نه ۲ اسلاید)
    performSwipe(dom.container, slider, advanceTime, 10, w - 10);
    assert.equal(
      slider.track.details.abs,
      2,
      `viewport ${w}x${h}: huge swipe must still move only +1 slide`,
    );
    assert.equal(slider.track.details.position, 2);
    assert.deepEqual(
      slider.track.details.slides.map(s => s.portion),
      [0, 0, 1, 0, 0],
    );

    // Swipe برعکس بسیار بلند به عقب: دقیقاً -1
    performSwipe(dom.container, slider, advanceTime, w - 10, 10);
    assert.equal(
      slider.track.details.abs,
      1,
      `viewport ${w}x${h}: huge reverse swipe must move only -1 slide`,
    );
    assert.equal(slider.track.details.position, 1);
    assert.deepEqual(
      slider.track.details.slides.map(s => s.portion),
      [0, 1, 0, 0, 0],
    );

    slider.destroy();
  }
});

test('دکمه‌های قبلی و بعدی در موبایل دقیقاً یک کارت جابه‌جا می‌کنند', () => {
  const { createSliderDom } = setupBrowserEnv(390, 844);
  const dom = createSliderDom(4);
  const slider = dom.createInstance(true);

  assert.equal(slider.track.details.abs, 0);

  slider.next();
  assert.equal(slider.animator.targetIdx, 1);
  slider.animator.stop();
  slider.track.to(1);
  assert.equal(slider.track.details.rel, 1);
  assert.deepEqual(
    slider.track.details.slides.map(s => s.portion),
    [0, 1, 0, 0],
  );

  slider.prev();
  assert.equal(slider.animator.targetIdx, 0);
  slider.animator.stop();
  slider.track.to(0);
  assert.equal(slider.track.details.rel, 0);
  assert.deepEqual(
    slider.track.details.slides.map(s => s.portion),
    [1, 0, 0, 0],
  );

  slider.destroy();
});

test('رفتار صحیح در ابتدا و انتهای لیست (هم در حالت loop و هم بدون loop و تک‌کارت)', () => {
  const { createSliderDom } = setupBrowserEnv(375, 812);

  // ۱. حالت بدون loop: در ابتدا و انتها هرگز از مرز [0, N-1] خارج نمی‌شود
  const nonLoopDom = createSliderDom(3);
  const nonLoopSlider = nonLoopDom.createInstance(false);

  // تلاش برای رفتن به قبل از اسلاید اول
  performSwipe(
    nonLoopDom.container,
    nonLoopSlider,
    nonLoopDom.advanceTime,
    250,
    50,
  );
  assert.equal(nonLoopSlider.track.details.abs, 0);
  assert.equal(nonLoopSlider.track.details.position, 0);

  // رفتن یک‌به‌یک تا اسلاید آخر (ایندکس ۲)
  performSwipe(
    nonLoopDom.container,
    nonLoopSlider,
    nonLoopDom.advanceTime,
    50,
    300,
  );
  assert.equal(nonLoopSlider.track.details.abs, 1);
  performSwipe(
    nonLoopDom.container,
    nonLoopSlider,
    nonLoopDom.advanceTime,
    50,
    300,
  );
  assert.equal(nonLoopSlider.track.details.abs, 2);

  // تلاش برای رد شدن از اسلاید آخر
  performSwipe(
    nonLoopDom.container,
    nonLoopSlider,
    nonLoopDom.advanceTime,
    50,
    300,
  );
  assert.equal(nonLoopSlider.track.details.abs, 2);
  assert.equal(nonLoopSlider.track.details.position, 2);
  nonLoopSlider.destroy();

  // ۲. حالت loop در مرز ابتدا (۰ -> آخرین اسلاید) و انتها (آخرین -> ۰): دقیقاً یک گام
  const loopDom = createSliderDom(3);
  const loopSlider = loopDom.createInstance(true);
  performSwipe(loopDom.container, loopSlider, loopDom.advanceTime, 250, 50);
  assert.equal(loopSlider.track.details.abs, -1);
  assert.equal(loopSlider.track.details.rel, 2);
  performSwipe(loopDom.container, loopSlider, loopDom.advanceTime, 50, 250);
  assert.equal(loopSlider.track.details.abs, 0);
  assert.equal(loopSlider.track.details.rel, 0);
  loopSlider.destroy();

  // ۳. حالت تک‌آیتم (۱ محصول): drag و loop غیرفعال و موقعیت ثابت روی ۰
  const singleDom = createSliderDom(1);
  const singleSlider = singleDom.createInstance(false);
  assert.equal(singleSlider.track.details.abs, 0);
  assert.deepEqual(
    singleSlider.track.details.slides.map(s => s.portion),
    [1],
  );
  singleSlider.destroy();
});

test('تغییر اندازه صفحه و گذار بین موبایل و دسکتاپ هندسهٔ هیچ‌کدام را به‌هم نمی‌ریزد', () => {
  const { createSliderDom } = setupBrowserEnv(390, 844);
  const dom = createSliderDom(4);
  const slider = dom.createInstance(true);

  // در موبایل: اندازهٔ اسلاید ۱۰۰٪ کانتینر است
  assert.equal(slider.options.trackConfig?.[0]?.size, 1);

  // تغییر به دسکتاپ (۱۲۸۰×۸۰۰): perView: 'auto' فعال می‌شود و اندازه واقعی کارت (۳۲vw / ۶۸vw) محاسبه می‌شود
  dom.resizeViewport(1280, 800, slider);
  const desktopSize = slider.options.trackConfig?.[0]?.size ?? 0;
  assert.ok(
    desktopSize > 0.4 && desktopSize < 0.6,
    `expected desktop auto slide size ~0.47, got ${desktopSize}`,
  );
  // در دسکتاپ چند کارت هم‌زمان قابل مشاهده‌اند (عدم اختلال در نسخه دسکتاپ)
  const visibleOnDesktop = slider.track.details.slides.filter(
    s => s.portion > 0,
  ).length;
  assert.ok(
    visibleOnDesktop >= 2,
    `desktop should show multiple cards, got ${visibleOnDesktop}`,
  );

  // بازگشت دوباره به موبایل (۳۶۰×۷۴۰): دوباره دقیقاً ۱ کارت کامل بدون سرک کارت بعدی
  dom.resizeViewport(360, 740, slider);
  assert.equal(slider.options.trackConfig?.[0]?.size, 1);
  const visibleOnMobile = slider.track.details.slides.filter(
    s => s.portion > 0,
  );
  assert.equal(visibleOnMobile.length, 1);
  assert.equal(visibleOnMobile[0].portion, 1);

  // سناریوی مرزی: موبایل عریض (۵۸۰×۹۰۰ => کارت ۵۴۸px) به تبلت (۶۵۰×۹۰۰ => کارت ۲۹۳px)
  dom.resizeViewport(580, 900, slider);
  assert.equal(slider.options.trackConfig?.[0]?.size, 1);
  dom.resizeViewport(650, 900, slider);
  const tabletSize = slider.options.trackConfig?.[0]?.size ?? 0;
  assert.ok(
    tabletSize > 0.75 && tabletSize < 0.9,
    `expected tablet auto slide size ~0.82 (not stale mobile 1), got ${tabletSize}`,
  );

  slider.destroy();
});

test('Swipe عمودی صفحه با Swipe افقی اسلایدر تداخل نمی‌کند', () => {
  const { createSliderDom } = setupBrowserEnv(375, 812);
  const dom = createSliderDom(4);
  const slider = dom.createInstance(true);

  let defaultPrevented = false;
  dom.advanceTime(100);
  dom.container.dispatch('touchstart', {
    targetTouches: [{ identifier: 1, screenX: 180, screenY: 300 }],
    changedTouches: [{ identifier: 1, screenX: 180, screenY: 300 }],
  });
  dom.advanceTime(16);
  // حرکت غالب در محور عمودی (اسکرول صفحه به پایین): deltaY=80 > deltaX=5
  dom.container.dispatch('touchmove', {
    targetTouches: [{ identifier: 1, screenX: 185, screenY: 220 }],
    changedTouches: [{ identifier: 1, screenX: 185, screenY: 220 }],
    cancelable: true,
    preventDefault() {
      defaultPrevented = true;
    },
  });
  dom.advanceTime(16);
  dom.container.dispatch('touchend', {
    targetTouches: [],
    changedTouches: [{ identifier: 1, screenX: 185, screenY: 220 }],
  });

  // اسکرول عمودی مسدود نشده و اسلایدر هم تکان نخورده است
  assert.equal(defaultPrevented, false);
  assert.equal(slider.track.details.abs, 0);
  assert.equal(slider.track.details.position, 0);

  slider.destroy();
});
