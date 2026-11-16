'use client';

import { useEffect, useRef, useState } from 'react';

import {
  HOME_SECTIONS,
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

/** آستانه‌ی «نزدیک بودن» به یک نقطه‌ی توقف (پیکسل) */
const SNAP_EPSILON = 12;

/** حداکثر زمان قفل «یک حرکت = یک بخش» (میلی‌ثانیه) */
const WHEEL_LOCK_MS = 900;

/** اگر دو رویداد چرخ به این اندازه نزدیک باشند، یک حرکت عمدی شمرده می‌شوند */
const GESTURE_GAP_MS = 220;

/** آستانه‌ی حرکت چرخ ماوس برای شمردن به‌عنوان حرکت عمدی */
const WHEEL_DELTA_THRESHOLD = 12;

/**
 * بازه‌ای که در آن جابه‌جایی برنامه‌ای (لینک #hash، کلیک دایره‌ها،
 * history.scrollRestoration) نباید به‌عنوان چرخ ماوس تفسیر شود.
 */
const PROGRAMMATIC_GUARD_MS = 1000;

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
 *   • ابتدای هر بخش اصلی (شش بخش صفحه‌ی اصلی)،
 *   • و هر زیرصفحه‌ای که خودش `data-home-snap` دارد (مثل شبکه‌ی دوم
 *     دسته‌بندی‌ها که یک صفحه‌ی کاملِ دیگر است).
 *
 * آخرین توقف همیشه ته صفحه است؛ پس صفحه یا روی ابتدای یک صفحه می‌ایستد یا
 * کامل پایین — هرگز نیمه‌کاره بین دو بخش.
 */
export function buildSnapStops({
  sections,
  maxScroll,
}: {
  sections: { id: string; top: number; height: number }[];
  maxScroll: number;
}): SnapStop[] {
  const stops: SnapStop[] = sections.map(section => ({
    top: Math.min(section.top, maxScroll),
    sectionId: section.id,
    isFooter: false,
  }));

  stops.push({ top: maxScroll, sectionId: 'footer', isFooter: true });

  return stops
    .sort((a, b) => a.top - b.top)
    .filter(
      (stop, index, list) => index === 0 || stop.top - list[index - 1].top > 4,
    );
}

export interface SnapTarget {
  /** مقصد نهایی (پیکسل از بالای سند) */
  top: number;
  /**
   * آیا برای رسیدن به مقصد رویداد چرخ را بلعید؟
   * برای فاصله‌های بسیار کم، اسکرول طبیعی مرورگر بهتر است.
   */
  intercept: boolean;
}

/**
 * انتخاب مقصد برای یک حرکت چرخ ماوس.
 *
 * - رو به پایین: نزدیک‌ترین توقفِ پایین‌تر از موقعیت فعلی.
 * - رو به بالا: نزدیک‌ترین توقفِ بالاتر؛ اگر خیلی نزدیک باشد (یعنی کاربر
 *   تازه از یک توقف پایین آمده) یک توقف بیشتر عقب می‌رویم تا حرکت «یک بخش
 *   کامل» حس شود.
 * - در لبه‌های سند `null` برمی‌گردد تا اسکرول طبیعی (کشش و …) دست‌نخورده
 *   بماند.
 */
export function pickSnapDestination({
  stops,
  scrollY,
  direction,
  viewportHeight,
}: {
  stops: number[];
  scrollY: number;
  direction: 1 | -1;
  viewportHeight: number;
}): SnapTarget | null {
  if (!stops.length) return null;

  const minGap = viewportHeight * 0.4;

  if (direction === 1) {
    const next = stops.find(stop => stop > scrollY + SNAP_EPSILON);

    return next === undefined ? null : { top: next, intercept: true };
  }

  if (scrollY <= SNAP_EPSILON) return null;

  const above = [...stops]
    .reverse()
    .find(stop => stop < scrollY - SNAP_EPSILON);

  if (above === undefined) {
    return scrollY > SNAP_EPSILON ? { top: 0, intercept: true } : null;
  }

  // تازه از یک توقف پایین آمده‌ایم → یک بخش کامل عقب
  if (scrollY - above < minGap) {
    const index = stops.indexOf(above);

    return index > 0
      ? { top: stops[index - 1], intercept: true }
      : { top: 0, intercept: true };
  }

  // همان بخشی هستیم و فقط کمی از لبه فاصله داریم → برگشت نرم
  return { top: above, intercept: scrollY - above > SNAP_EPSILON * 4 };
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
function measureStops() {
  const elements = Array.from(
    document.querySelectorAll(`${SECTION_SELECTOR}, [data-home-snap]`),
  );

  const sections = elements
    .map(el => ({
      id: el.id || el.getAttribute('data-home-snap-id') || 'snap',
      top: el.getBoundingClientRect().top + window.scrollY,
      height: el.getBoundingClientRect().height,
    }))
    .filter(section => section.height > 0);

  return buildSnapStops({
    sections,
    maxScroll: Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    ),
  });
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
 * 3. بخش فعال را با IntersectionObserver تشخیص می‌دهد.
 * 4. نوار پیشرفت بالای صفحه و ناوبری دایره‌ای سمت راست را می‌سازد.
 * 5. ارتفاع واقعی هدر را در `--zp-header-h` می‌گذارد.
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

  /* ── بخش‌های موجود + ارتفاع هدر ───────────────────────────────────────── */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('home-scroll');

    const syncHeader = () => {
      root.style.setProperty('--zp-header-h', `${headerHeight()}px`);
    };

    const collect = () => {
      const present = new Set(
        Array.from(document.querySelectorAll(SECTION_SELECTOR)).map(
          el => el.id,
        ),
      );

      setState(prev => {
        const sections = HOME_SECTIONS.filter(section =>
          present.has(section.id),
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
    };

    syncHeader();
    collect();

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
      clearTimeout(timer);
      observer?.disconnect();
      root.classList.remove('home-scroll');
      root.style.removeProperty('--zp-header-h');
    };
  }, []);

  /* ── بخش فعال (IntersectionObserver) ──────────────────────────────────── */
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll(SECTION_SELECTOR));
    if (!elements.length) return;

    /*
     * یک «نوار دید» در بالای صفحه: هر بخشی که این نوار را قطع کند فعال است.
     * چون هر بخش یک صفحه است، در هر لحظه فقط یک بخش (یا در حال گذار دو بخش)
     * این نوار را قطع می‌کند و بزرگ‌ترین نسبت، برنده است.
     */
    const ratios = new Map<string, number>();

    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            ratios.set(entry.target.id, entry.intersectionRatio);
          } else {
            ratios.delete(entry.target.id);
          }
        }

        if (!ratios.size) return;

        const [activeId] = [...ratios.entries()].sort((a, b) => b[1] - a[1])[0];
        const index = stateRef.current.sections.findIndex(
          section => section.id === activeId,
        );

        if (index >= 0 && index !== stateRef.current.activeIndex) {
          setState(prev => ({ ...prev, activeIndex: index }));
        }
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.5, 1] },
    );

    elements.forEach(el => io.observe(el));

    return () => io.disconnect();
  }, [state.sections.length]);

  /* ── نوار پیشرفت ─────────────────────────────────────────────────────── */
  useEffect(() => {
    let frame = 0;

    const paint = () => {
      frame = 0;

      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const ratio =
        maxScroll > 0
          ? Math.min(1, Math.max(0, window.scrollY / maxScroll))
          : 0;

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${ratio})`;
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

    /**
     * تا این لحظه، چرخ ماوس را بلع می‌کنیم تا یک حرکت فیزیکی دو بخش را جلو
     * نبرد. اگر کاربر جهت را برگرداند، بلافاصله آزاد می‌شود (احساس گیر کردن
     * نمی‌دهد).
     */
    let lockedUntil = 0;
    let lockedDirection: 1 | -1 = 1;

    /** بازه‌ی محافظت بعد از جابه‌جایی برنامه‌ای (کلیک دایره‌ها، #hash، back) */
    let guardUntil = 0;

    /** زمان آخرین رویداد چرخ؛ برای تشخیص «یک حرکت فیزیکی» */
    let lastWheelAt = 0;

    let cachedStops: number[] = [];
    let cacheAt = 0;

    const stops = () => {
      const now = performance.now();
      if (!cachedStops.length || now - cacheAt > 500) {
        cachedStops = measureStops().map(stop => stop.top);
        cacheAt = now;
      }

      return cachedStops;
    };

    const onWheel = (event: WheelEvent) => {
      // زوم/میان‌بر مرورگر
      if (event.ctrlKey || event.metaKey) return;

      // اسکرول افقی (ترک‌پد) ربطی به بخش‌ها ندارد
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      if (Math.abs(event.deltaY) < WHEEL_DELTA_THRESHOLD) return;

      // منو/دیالوگ/لیست باز → اسکرول طبیعی همان لایه
      if (
        event.target instanceof Element &&
        event.target.closest(OVERLAY_SELECTOR)
      ) {
        return;
      }

      const now = performance.now();
      const direction: 1 | -1 = event.deltaY > 0 ? 1 : -1;

      /*
       * در حال حرکت هستیم (یا همین لحظه جابه‌جایی برنامه‌ای رخ داده):
       * چرخ اضافه را می‌بلعیم تا با یک حرکت، دو بخش جلو نرویم.
       * اما اگر کاربر جهت را برگرداند، همان لحظه آزاد می‌شویم — گیر کردن
       * روی یک اسکرول در حال اجرا تجربه‌ی بدی می‌سازد.
       */
      if (now < lockedUntil || now < guardUntil) {
        const reversed = now < lockedUntil && direction !== lockedDirection;

        if (!reversed) {
          lastWheelAt = now;
          event.preventDefault();
          return;
        }

        lockedUntil = 0;
      }

      /*
       * چند رویداد پشت‌سرهم = یک حرکت فیزیکی.
       *
       * تفاوت مهم: اگر کاربر چرخ را سریع و پیوسته بچرخاند (فاصله‌ی رویدادها
       * کمتر از GESTURE_GAP_MS) همه‌ی آن‌ها یک حرکت شمرده می‌شوند و فقط یک
       * بخش جلو می‌روند. اگر بین دو رویداد فاصله بیفتد، حرکت جدید است و بخش
       * بعدی را می‌برد — همان چیزی که کاربر از «چرخاندن عمدی» انتظار دارد.
       */
      if (now - lastWheelAt < GESTURE_GAP_MS) {
        lastWheelAt = now;
        event.preventDefault();
        return;
      }

      lastWheelAt = now;

      const target = pickSnapDestination({
        stops: stops(),
        scrollY: window.scrollY,
        direction,
        viewportHeight: window.innerHeight,
      });

      // لبه‌ی سند → اسکرول طبیعی
      if (target === null) return;

      // فاصله‌ی ناچیز: اسکرول طبیعی مرورگر کافی است
      if (!target.intercept) return;

      event.preventDefault();

      const reduced = prefersReducedMotion();

      lockedDirection = direction;
      lockedUntil = now + (reduced ? 150 : WHEEL_LOCK_MS);

      window.scrollTo({
        top: Math.max(0, target.top),
        behavior: reduced ? 'auto' : 'smooth',
      });
    };

    /*
     * جابه‌جایی برنامه‌ای (کلیک دایره‌ها، لینک #hash، بازگشت مرورگر) نباید
     * بلافاصله با یک اسکرول اسنپ دیگر قطع شود.
     */
    const onProgrammatic = () => {
      guardUntil = performance.now() + PROGRAMMATIC_GUARD_MS;
      cachedStops = [];
    };

    let resizeTimer = 0;
    const onResize = () => {
      cachedStops = [];
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        cachedStops = [];
      }, 200);
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

  /* ── رفتن به یک بخش (کلیک روی دایره) ─────────────────────────────────── */
  const goToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    window.dispatchEvent(new Event('zp:home-nav'));

    window.scrollTo({
      top: Math.max(0, el.getBoundingClientRect().top + window.scrollY),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  const { sections, activeIndex } = state;

  return (
    <>
      {/*
        نوار پیشرفت اسکرول — بالاتر از هدر و در بالاترین لبه‌ی صفحه.
        `pointer-events-none` و ارتفاع ۳px: هیچ تداخلی با هدر ندارد و چون
        `fixed` است هیچ جابه‌جایی چیدمانی ایجاد نمی‌کند.
      */}
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

      {/* ناوبری دایره‌ای سمت راست — فقط دسکتاپ */}
      {sections.length > 1 && (
        <nav
          aria-label="پیمایش بخش‌های صفحه اصلی"
          className="fixed top-1/2 right-5 z-40 hidden -translate-y-1/2 lg:block"
        >
          <ul className="flex flex-col items-center gap-1">
            {sections.map((section, index) => (
              <li key={section.id}>
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
                        ? 'size-2.5 bg-stone-900 ring-stone-900'
                        : 'size-2 bg-stone-300/60 ring-stone-400/70 group-hover/dot:bg-stone-400'
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
