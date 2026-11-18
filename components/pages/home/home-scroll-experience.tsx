'use client';

import { ArrowUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  HOME_FOOTER_ID,
  HOME_NAV_ITEMS,
  type HomeSectionMeta,
} from '@/components/pages/home/home-sections';

/* ────────────────────────────────────────────────────────────────────────── */
/* ثابت‌ها                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * ارتفاع پیش‌فرض هدر — همان `h-13` (۳.۲۵rem ≈ ۵۲px).
 * بعد از mount مقدار واقعی اندازه‌گیری و در `--zp-header-h` نوشته می‌شود.
 */
const DEFAULT_HEADER_HEIGHT = 52;

const HEADER_SELECTOR = 'header';
const SECTION_SELECTOR = '[data-home-section]';
const SNAP_SELECTOR = '[data-home-snap]';

/** آستانه‌ی «نزدیک بودن» به یک نقطه‌ی توقف (پیکسل) */
const SNAP_EPSILON = 2;

/**
 * اگر بین دو رویداد چرخ بیش از این فاصله باشد، حرکت جدید (gesture) شمرده
 * می‌شود.
 *
 * مقدار عمداً کوتاه است: دنباله‌ی اینرسیِ ترک‌پد پیوسته می‌آید (فاصله‌ی
 * چند میلی‌ثانیه) و با این آستانه یک حرکت حساب می‌شود؛ اما دو حرکت عمدی
 * پشت‌سرهم فاصله‌ی بیشتری دارند و دومی بلعیده نمی‌شود. قفل‌های طولانی
 * قبلی باعث می‌شد کاربر برای رفتن به بخش بعد «چند بار» بچرخاند.
 */
const GESTURE_GAP_MS = 120;

/** مجموع جابه‌جایی چرخ (px) برای شمردن یک حرکت عمدی */
const WHEEL_STEP_THRESHOLD = 20;

/**
 * بازه‌ای که در آن جابه‌جایی برنامه‌ای (کلیک دایره‌ها، #hash، back) نباید
 * به‌عنوان چرخ ماوس تفسیر شود.
 */
const PROGRAMMATIC_GUARD_MS = 700;

/** سقف زمان انتظار برای تمام‌شدن انیمیشن اسکرول */
const ANIMATION_TIMEOUT_MS = 1200;

/** نسبت ارتفاع صفحه که برای تشخیص «بخش در دید» استفاده می‌شود */
const ACTIVE_PROBE_RATIO = 0.25;

/** المان‌هایی که چرخ ماوس در آن‌ها باید طبیعی بماند (منو، دیالوگ، لیست کشویی) */
const OVERLAY_SELECTOR = [
  '[role="dialog"]',
  '[role="menu"]',
  '[role="listbox"]',
  '[role="tooltip"]',
  '[data-slot="dialog-content"]',
  '[data-slot="sheet-content"]',
  '[data-slot="popover-content"]',
  '[data-slot="select-content"]',
].join(',');

/** محدوده‌ای که چرخ ماوس در آن «پیمایش بخش‌به‌بخش» را فعال می‌کند */
const SEQUENCE_SELECTOR = `${SECTION_SELECTOR}, ${SNAP_SELECTOR}, #${HOME_FOOTER_ID}, [data-home-controls]`;

/* ────────────────────────────────────────────────────────────────────────── */
/* ابزارهای خالص — بدون وابستگی به مرورگر (قابل تست)                          */
/* ────────────────────────────────────────────────────────────────────────── */

export interface SnapStop {
  /** فاصله‌ی نقطه‌ی توقف از بالای سند */
  top: number;
  /** بخشی که این نقطه به آن تعلق دارد */
  sectionId: string;
  /** آخرین توقف صفحه (برای اینکه فوتر کامل دیده شود) */
  isFooter: boolean;
}

/**
 * ساخت نقاط توقف اسنپ.
 *
 * ورودی، ابتدای هر «صفحه‌ی اسنپ» است:
 *
 *   • ابتدای هر بخش اصلی صفحه،
 *   • هر زیرصفحه‌ای که خودش `data-home-snap` دارد (مثل دو صفحه‌ی
 *     دسته‌بندی‌ها).
 *
 * آخرین توقف همیشه ته صفحه است؛ برای همین فوتر با ارتفاع طبیعی خودش
 * (نه کشیده‌شده) کامل دیده می‌شود و یک مقصد مستقل هم دارد.
 */
export function buildSnapStops({
  sections,
  maxScroll,
  footerTop,
}: {
  sections: { id: string; top: number; height: number }[];
  maxScroll: number;
  /**
   * ابتدای فوتر در سند. اگر فوتر از یک صفحه بلندتر باشد، مقصد فوتر همان
   * ابتدای فوتر است؛ در غیر این صورت ته صفحه (فوتر کامل و چسبیده به پایین).
   */
  footerTop?: number;
}): SnapStop[] {
  const stops: SnapStop[] = sections.map(section => ({
    top: Math.min(Math.max(0, section.top), Math.max(0, maxScroll)),
    sectionId: section.id,
    isFooter: false,
  }));

  stops.push({
    top: Math.min(
      Math.max(0, footerTop ?? maxScroll),
      Math.max(0, maxScroll),
    ),
    sectionId: HOME_FOOTER_ID,
    isFooter: true,
  });

  return stops
    .sort((a, b) => a.top - b.top)
    .filter(
      (stop, index, list) => index === 0 || stop.top - list[index - 1].top > 4,
    );
}

/**
 * شماره‌ی نقطه‌ی توقفی که کاربر روی/بعد از آن ایستاده است.
 * (آخرین توقفی که از موقعیت فعلی بالاتر نیست.)
 */
export function stopIndexAt(stops: SnapStop[], scrollY: number): number {
  let index = 0;

  for (let i = 0; i < stops.length; i += 1) {
    if (stops[i].top <= scrollY + SNAP_EPSILON) index = i;
  }

  return index;
}

/** شماره‌ی مقصد یک حرکت؛ اگر از محدوده بیرون بزند `null`. */
export function stepStopIndex(
  stops: SnapStop[],
  {
    fromIndex,
    direction,
  }: {
    fromIndex: number;
    direction: 1 | -1;
  },
): number | null {
  if (!stops.length) return null;

  const current = Math.min(Math.max(0, fromIndex), stops.length - 1);
  const next = current + direction;

  if (next < 0 || next >= stops.length) return null;

  return next;
}

/**
 * شماره‌ی نقطه‌ی توقفی که «بخش در دید» را نشان می‌دهد.
 *
 * از موقعیت واقعی اسکرول حساب می‌شود (نه از مقصد انیمیشن) تا دایره‌ی فعال
 * همیشه همان چیزی باشد که کاربر می‌بیند. هنگام رسیدن به ته صفحه، فوتر
 * برنده است تا دایره‌ی فوتر هم فعال شود.
 */
export function activeStopIndex(
  stops: SnapStop[],
  {
    scrollY,
    maxScroll,
    viewportHeight,
  }: {
    scrollY: number;
    maxScroll: number;
    viewportHeight: number;
  },
): number {
  if (!stops.length) return -1;

  if (maxScroll > 0 && scrollY >= maxScroll - SNAP_EPSILON) {
    return stops.length - 1;
  }

  const probe = scrollY + Math.max(SNAP_EPSILON, viewportHeight * ACTIVE_PROBE_RATIO);

  let index = 0;

  for (let i = 0; i < stops.length; i += 1) {
    if (!stops[i].isFooter && stops[i].top <= probe) index = i;
  }

  return index;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* اندازه‌گیری                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function headerHeight() {
  const header = document.querySelector(HEADER_SELECTOR);
  const height = header?.getBoundingClientRect().height ?? 0;

  return height > 0 ? height : DEFAULT_HEADER_HEIGHT;
}

/**
 * اندازه‌گیری ارتفاع واقعی بخش‌ها با `getBoundingClientRect`؛ موبایل‌هایی که
 * بخش را به‌اندازه‌ی محتوا بزرگ‌تر از یک صفحه می‌کنند هم درست حساب می‌شوند.
 */
function measureStops(): SnapStop[] {
  const elements = Array.from(
    document.querySelectorAll(`${SECTION_SELECTOR}, ${SNAP_SELECTOR}`),
  );

  const sections = elements
    .map(el => {
      const rect = el.getBoundingClientRect();

      return {
        id:
          el.id ||
          el.getAttribute('data-home-snap-id') ||
          (el.hasAttribute('data-home-snap') ? 'snap' : ''),
        top: rect.top + window.scrollY,
        height: rect.height,
      };
    })
    .filter(section => section.id && section.height > 0);

  const footer = document.getElementById(HOME_FOOTER_ID);
  const footerTop = footer
    ? footer.getBoundingClientRect().top + window.scrollY
    : undefined;

  return buildSnapStops({
    sections,
    maxScroll: Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    ),
    footerTop,
  });
}

function maxScrollTop() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ────────────────────────────────────────────────────────────────────────── */
/* کامپوننت                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

interface HomeScrollState {
  sections: HomeSectionMeta[];
  activeIndex: number;
}

/**
 * تجربه‌ی اسکرول صفحه‌ی اصلی:
 *
 * 1. `scroll-snap` را فقط روی همین صفحه فعال می‌کند (`html.home-scroll`).
 * 2. در دسکتاپ «یک حرکت چرخ ماوس = یک بخش» را تضمین می‌کند.
 * 3. بخش فعال را از موقعیت واقعی اسکرول تشخیص می‌دهد (یک منبع حقیقت با
 *    نقاط توقف چرخ و دایره‌ها).
 * 4. نوار پیشرفت بالا و ناوبری دایره‌ای (شامل فوتر) را می‌سازد.
 * 5. دکمه‌ی «بازگشت به ابتدا» را از بخش دوم به بعد نشان می‌دهد.
 * 6. ارتفاع واقعی هدر را در `--zp-header-h` می‌گذارد.
 *
 * هیچ چیزِ صفحه‌های دیگر تغییر نمی‌کند و همه‌ی افکت‌ها با unmount پاک می‌شوند.
 */
export default function HomeScrollExperience() {
  const [state, setState] = useState<HomeScrollState>({
    sections: [],
    activeIndex: 0,
  });

  const progressRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const stopsRef = useRef<SnapStop[]>([]);

  /** وضعیت انیمیشن مشترک بین چرخ، دایره‌ها و تشخیص بخش فعال */
  const animatingRef = useRef(false);
  const targetIndexRef = useRef(-1);
  const animationStartedRef = useRef(0);

  /**
   * پیمایش «یک حرکت = یک بخش» فقط دسکتاپ است.
   * با state نگه داشته می‌شود تا اگر کاربر پنجره را تغییر اندازه داد، افکت
   * دوباره اجرا/حذف شود (نه اینکه روی حالت اولیه قفل بماند).
   */
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  // به‌روزرسانی ref در افکت (نوشتن ref داخل رندر مجاز نیست)
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /* ── بخش‌های موجود + نقاط توقف + ارتفاع هدر ───────────────────────────── */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('home-scroll');

    const syncHeader = () => {
      root.style.setProperty('--zp-header-h', `${headerHeight()}px`);
    };

    const measure = () => {
      stopsRef.current = measureStops();
    };

    const collect = () => {
      const present = new Set(
        Array.from(document.querySelectorAll(SECTION_SELECTOR)).map(
          el => el.id,
        ),
      );
      const hasFooter = Boolean(document.getElementById(HOME_FOOTER_ID));

      setState(prev => {
        const sections = HOME_NAV_ITEMS.filter(section =>
          section.isFooter ? hasFooter : present.has(section.id),
        );

        const activeIndex = Math.min(
          prev.activeIndex,
          Math.max(0, sections.length - 1),
        );

        // بدون تغییر واقعی، رندر دوباره نکن
        if (
          sections.length === prev.sections.length &&
          sections.every(
            (section, index) => section.id === prev.sections[index]?.id,
          ) &&
          activeIndex === prev.activeIndex
        ) {
          return prev;
        }

        return { sections, activeIndex };
      });

      measure();
    };

    syncHeader();
    collect();

    // اولین اندازه‌گیری بعد از layout کامل (فونت/تصاویر)
    const initialRaf = requestAnimationFrame(measure);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            clearTimeout(timer);
            timer = setTimeout(() => {
              syncHeader();
              collect();
            }, 180);
          });

    observer?.observe(document.body);

    return () => {
      cancelAnimationFrame(initialRaf);
      clearTimeout(timer);
      observer?.disconnect();
      root.classList.remove('home-scroll');
      root.style.removeProperty('--zp-header-h');
      stopsRef.current = [];
    };
  }, []);

  /* ── نوار پیشرفت + دایره‌ی فعال (یک listener اسکرول) ─────────────────── */
  useEffect(() => {
    let frame = 0;

    const paint = () => {
      frame = 0;

      const scrollY = window.scrollY;
      const maxScroll = maxScrollTop();
      const viewportHeight = window.innerHeight;

      const ratio =
        maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${ratio})`;
      }

      if (!stopsRef.current.length) {
        stopsRef.current = measureStops();
      }

      /*
       * وقتی اسکرول برنامه‌ای/چرخ در جریان است، دایره‌ی مقصد را فعال نگه
       * داریم تا دایره موقع حرکت بین دو بخش عقب‌وجلو نپرد. بعد از توقف،
       * موقعیت واقعی اسکرول دوباره منبع حقیقت می‌شود.
       */
      const targetIndex =
        animatingRef.current && targetIndexRef.current >= 0
          ? targetIndexRef.current
          : -1;

      const index =
        targetIndex >= 0
          ? targetIndex
          : activeStopIndex(stopsRef.current, {
              scrollY,
              maxScroll,
              viewportHeight,
            });

      const activeId = index >= 0 ? stopsRef.current[index]?.sectionId : null;

      if (activeId) {
        setState(prev => {
          const activeIndex = prev.sections.findIndex(
            section => section.id === activeId,
          );

          if (activeIndex < 0 || activeIndex === prev.activeIndex) return prev;

          return { ...prev, activeIndex };
        });
      }

      /* پایان انیمیشن: رسیدن به مقصد یا اتمام زمان مجاز */
      if (animatingRef.current && targetIndexRef.current >= 0) {
        const targetTop = stopsRef.current[targetIndexRef.current]?.top;
        const reached =
          targetTop !== undefined && Math.abs(scrollY - targetTop) <= SNAP_EPSILON;
        const timedOut =
          performance.now() - animationStartedRef.current > ANIMATION_TIMEOUT_MS;

        if (reached || timedOut) {
          animatingRef.current = false;
          targetIndexRef.current = -1;
        }
      }
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(paint);
    };

    paint();

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    // تغییر ارتفاع سند بدون اسکرول (لود تصویر) هم باید نوار را اصلاح کند
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(schedule);

    observer?.observe(document.body);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
    };
  }, []);

  /* ── دسکتاپ یا موبایل ─────────────────────────────────────────────────── */
  useEffect(() => {
    const query = window.matchMedia('(min-width: 64rem)');
    const sync = () => setIsDesktop(query.matches);

    sync();
    query.addEventListener('change', sync);

    return () => query.removeEventListener('change', sync);
  }, []);

  /* ── یک حرکت چرخ ماوس = یک بخش (دسکتاپ) ─────────────────────────────── */
  useEffect(() => {
    if (!isDesktop) return;

    /** بازه‌ی محافظت بعد از جابه‌جایی برنامه‌ای (کلیک دایره‌ها، #hash، back) */
    let guardUntil = 0;

    /** زمان آخرین رویداد چرخ؛ برای تشخیص «یک حرکت فیزیکی» */
    let lastWheelAt = 0;

    /** مجموع جابه‌جایی همین حرکت (برای آستانه‌ی عمدی‌بودن) */
    let gestureDelta = 0;

    /** آیا همین حرکت یک بخش را جلو/عقب برده است؟ */
    let gestureUsed = false;

    /** جهت آخرین پرش؛ برای تشخیص برگشت جهت در همان حرکت */
    let lastStepDirection: 1 | -1 = 1;

    const stops = () => {
      if (!stopsRef.current.length) stopsRef.current = measureStops();

      return stopsRef.current;
    };

    const goToStop = (index: number) => {
      const list = stops();
      const stop = list[index];
      if (!stop) return;

      const reduced = prefersReducedMotion();

      animatingRef.current = !reduced;
      targetIndexRef.current = index;
      animationStartedRef.current = performance.now();

      window.scrollTo({
        top: stop.top,
        behavior: reduced ? 'auto' : 'smooth',
      });

      if (reduced) {
        animatingRef.current = false;
        targetIndexRef.current = -1;
      }
    };

    const onWheel = (event: WheelEvent) => {
      // زوم/میان‌بر مرورگر
      if (event.ctrlKey || event.metaKey) return;

      /*
       * deltaMode ممکن است پیکسل (کروم) یا خط/صفحه (فایرفاکس) باشد؛ بدون
       * نرمال‌سازی، یک «کلیک» چرخ در فایرفاکس به آستانه نمی‌رسید و کاربر
       * مجبور می‌شد چند بار بچرخاند.
       */
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? window.innerHeight
            : 1;
      const deltaX = event.deltaX * unit;
      const deltaY = event.deltaY * unit;

      // اسکرول افقی (ترک‌پد) ربطی به بخش‌ها ندارد
      if (Math.abs(deltaX) > Math.abs(deltaY)) return;
      if (!deltaY) return;

      const target = event.target instanceof Element ? event.target : null;

      // منو/دیالوگ/لیست باز → اسکرول طبیعی همان لایه
      if (target?.closest(OVERLAY_SELECTOR)) return;

      // چرخ فقط وقتی روی دنباله‌ی اسلایدهاست بخش‌به‌بخش می‌شود
      if (!target?.closest(SEQUENCE_SELECTOR)) return;

      const now = performance.now();

      // شروع یک حرکت فیزیکی جدید
      if (now - lastWheelAt > GESTURE_GAP_MS) {
        gestureDelta = 0;
        gestureUsed = false;
      }

      lastWheelAt = now;
      gestureDelta += deltaY;

      const list = stops();
      if (!list.length) return;

      // بعد از کلیک دایره، اسکرول برنامه‌ای را قطع نکن
      if (now < guardUntil) {
        event.preventDefault();
        return;
      }

      const baseIndex =
        animatingRef.current && targetIndexRef.current >= 0
          ? targetIndexRef.current
          : stopIndexAt(list, window.scrollY);
      const direction: 1 | -1 = deltaY > 0 ? 1 : -1;

      // در ابتدا/انتهای صفحه، اسکرول طبیعی مرورگر دست‌نخورده بماند
      if (stepStopIndex(list, { fromIndex: baseIndex, direction }) === null) {
        return;
      }

      // از اینجا به بعد حرکت طبیعی صفحه را متوقف می‌کنیم تا «یک حرکت = یک بخش» شود
      event.preventDefault();

      /*
       * اگر همین حرکت یک بخش را برده باشد، ادامه‌ی همان حرکت (اینرسی) را
       * می‌بلعیم. اما اگر کاربر در همان حرکت جهت را برگرداند، بلافاصله
       * اجازه می‌دهیم برگردد؛ گیر کردن روی یک اسکرول در حال اجرا تجربه‌ی
       * بدی می‌سازد.
       */
      if (gestureUsed && gestureDelta * lastStepDirection > 0) return;
      if (Math.abs(gestureDelta) < WHEEL_STEP_THRESHOLD) return;

      // جهت مجموع حرکت (ممکن است کاربر وسط حرکت جهت را برگرداند)
      const stepDirection: 1 | -1 = gestureDelta > 0 ? 1 : -1;
      const destinationIndex = stepStopIndex(list, {
        fromIndex: baseIndex,
        direction: stepDirection,
      });

      if (destinationIndex === null) return;

      gestureUsed = true;
      lastStepDirection = stepDirection;
      goToStop(destinationIndex);
    };

    const invalidate = () => {
      stopsRef.current = [];
    };

    /*
     * جابه‌جایی برنامه‌ای (کلیک دایره‌ها، لینک #hash، بازگشت مرورگر) نباید
     * بلافاصله با یک اسکرول اسنپ دیگر قطع شود.
     */
    const onProgrammatic = () => {
      guardUntil = performance.now() + PROGRAMMATIC_GUARD_MS;
      animatingRef.current = false;
      targetIndexRef.current = -1;
      invalidate();
    };

    let resizeTimer = 0;
    const onResize = () => {
      invalidate();
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(invalidate, 200);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('zp:home-nav', onProgrammatic);
    window.addEventListener('hashchange', onProgrammatic);
    window.addEventListener('popstate', onProgrammatic);
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('zp:home-nav', onProgrammatic);
      window.removeEventListener('hashchange', onProgrammatic);
      window.removeEventListener('popstate', onProgrammatic);
      window.removeEventListener('resize', onResize);
    };
  }, [isDesktop]);

  /* ── رفتن به یک مقصد (دایره‌ها و دکمه‌ی بازگشت) ──────────────────────── */
  const goToSection = (id: string) => {
    if (!stopsRef.current.length) stopsRef.current = measureStops();

    const list = stopsRef.current;
    const index = list.findIndex(stop => stop.sectionId === id);

    if (index < 0) return;

    const reduced = prefersReducedMotion();

    window.dispatchEvent(new Event('zp:home-nav'));

    animatingRef.current = !reduced;
    targetIndexRef.current = index;
    animationStartedRef.current = performance.now();

    window.scrollTo({
      top: list[index].top,
      behavior: reduced ? 'auto' : 'smooth',
    });

    if (reduced) {
      animatingRef.current = false;
      targetIndexRef.current = -1;
    }

    // بازخورد فوری روی دایره‌ی فعال (اسکرول هم دوباره تأییدش می‌کند)
    setState(prev => {
      const activeIndex = prev.sections.findIndex(section => section.id === id);

      if (activeIndex < 0 || activeIndex === prev.activeIndex) return prev;

      return { ...prev, activeIndex };
    });
  };

  const { sections, activeIndex } = state;
  const showBackToTop = activeIndex > 0;

  return (
    <>
      {/* نوار پیشرفت اسکرول — بالاتر از هدر */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] bg-black/[0.06]"
      >
        <div
          ref={progressRef}
          data-home-progress
          className="home-progress-fill h-full w-full bg-[var(--zp-home-accent)]"
        />
      </div>

      {/* دکمه‌ی بازگشت به ابتدای صفحه — از بخش دوم به بعد */}
      {showBackToTop && (
        <button
          type="button"
          data-home-controls
          onClick={() => goToSection('home-hero')}
          aria-label="بازگشت به ابتدای صفحه"
          title="بازگشت به ابتدای صفحه"
          className="fixed bottom-[calc(var(--zp-mobile-nav-h)+1rem)] left-1.5 z-40 flex size-11 items-center justify-center rounded-full border border-stone-200 bg-white/90 text-stone-900 shadow-lg backdrop-blur transition hover:bg-white hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 lg:bottom-6 lg:size-10"
        >
          <ArrowUp className="size-5" aria-hidden="true" />
        </button>
      )}

      {/* ناوبری دایره‌ای سمت راست — فقط دسکتاپ */}
      {sections.length > 1 && (
        <nav
          data-home-controls
          aria-label="پیمایش بخش‌های صفحه اصلی"
          className="fixed top-1/2 right-5 z-40 hidden -translate-y-1/2 lg:block"
        >
          <ul className="flex flex-col items-center gap-1">
            {sections.map((section, index) => (
              <li
                key={section.id}
                className={
                  section.isFooter
                    ? 'mt-2 border-t border-stone-300/70 pt-2'
                    : undefined
                }
              >
                <button
                  type="button"
                  onClick={() => goToSection(section.id)}
                  aria-label={section.label}
                  aria-current={index === activeIndex ? 'true' : undefined}
                  title={section.label}
                  className="group/dot flex size-8 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
                >
                  <span
                    className={`block rounded-full ring-1 transition-all duration-300 ease-out ${
                      index === activeIndex
                        ? 'size-2.5 bg-stone-900 ring-2 ring-white/90 shadow-md'
                        : 'size-2 bg-white/85 ring-1 ring-stone-400/80 shadow-sm group-hover/dot:bg-white'
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
