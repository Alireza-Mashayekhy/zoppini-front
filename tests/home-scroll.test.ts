import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import {
  buildSnapStops,
  pickSnapDestination,
} from '../components/pages/home/home-scroll-experience';
import {
  HOME_SECTIONS,
  type HomeSectionMeta,
} from '../components/pages/home/home-sections';

const source = (path: string) =>
  readFileSync(resolve(__dirname, '..', path), 'utf8');

const pageSrc = source('app/(public)/page.tsx');
const scrollSrc = source('components/pages/home/home-scroll-experience.tsx');
const cssSrc = source('styles/home-scroll.css');
const heroSrc = source('components/pages/home/hero-new-in-transition.tsx');
const categorySrc = source('components/pages/home/category-section.tsx');
const bannerSrc = source('components/pages/home/sale-banner.tsx');
const styleSrc = source('components/pages/home/suggested-style.tsx');
const endSrc = source('components/pages/home/end-video.tsx');
const headerSrc = source('components/layout/public/header-scroll.tsx');
const footerSrc = source('components/layout/public/footer.tsx');
const newInSrc = source('components/pages/home/new-in.tsx');

/* ────────────────────────────────────────────────────────────────────────── */
/* نقاط توقف                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const VIEWPORT = 900;

/** شش بخش تمام‌صفحه + یک بخش دو صفحه‌ای + فوتر */
const sections = [
  { id: 'home-hero', top: 0, height: VIEWPORT },
  { id: 'home-new-in', top: 900, height: VIEWPORT },
  { id: 'home-sale', top: 1800, height: VIEWPORT },
  { id: 'home-categories', top: 2700, height: VIEWPORT * 1.9 },
  { id: 'home-style', top: 4410, height: VIEWPORT },
  { id: 'home-end', top: 5310, height: VIEWPORT },
];

const documentHeight = 5310 + VIEWPORT + 700; // + فوتر ۷۰۰px
const maxScroll = documentHeight - VIEWPORT;

const stops = buildSnapStops({
  sections,
  maxScroll,
});

test('هر بخش اصلی یک نقطه‌ی توقف دارد', () => {
  for (const section of sections) {
    assert.ok(
      stops.some(stop => stop.sectionId === section.id),
      `missing snap stop for ${section.id}`,
    );
  }
});

test('ابتدای هر بخش روی پیکسل دقیق خودش است (نه وسط راه)', () => {
  for (const section of sections) {
    const stop = stops.find(item => item.sectionId === section.id);
    assert.equal(stop?.top, section.top);
  }
});

test('ته صفحه همیشه آخرین نقطه‌ی توقف است تا فوتر کامل دیده شود', () => {
  const last = stops.at(-1);
  assert.equal(last?.isFooter, true);
  assert.equal(last?.top, maxScroll);
});

test('نقاط توقف صعودی، یکتا و بدون تکرار نزدیک هستند', () => {
  for (let i = 1; i < stops.length; i += 1) {
    assert.ok(stops[i].top > stops[i - 1].top);
    assert.ok(stops[i].top - stops[i - 1].top > 4);
  }
});

test('نقاط توقف هرگز از ته صفحه بیشتر نمی‌شوند', () => {
  for (const stop of stops) {
    assert.ok(stop.top <= maxScroll);
    assert.ok(stop.top >= 0);
  }
});

test('هر بخش اصلی دقیقاً یک نقطه‌ی توقف می‌گیرد (بدون توقف اضافه)', () => {
  for (const section of sections) {
    const count = stops.filter(stop => stop.sectionId === section.id).length;
    assert.equal(count, 1, `${section.id} should have exactly one snap stop`);
  }
});

test('زیرصفحه‌های دسته‌بندی‌ها به‌عنوان صفحه‌ی جدا در نقاط توقف ظاهر می‌شوند', () => {
  /*
   * شبکه‌ی دوم دسته‌بندی‌ها با data-home-snap علامت خورده و در measurement
   * جداگانه خوانده می‌شود؛ یعنی اسنپ روی همان شبکه هم می‌ایستد و محتوایش
   * یک‌باره رد نمی‌شود.
   */
  const withSubPage = buildSnapStops({
    sections: [
      ...sections,
      { id: 'snap', top: 2700 + VIEWPORT * 0.95, height: VIEWPORT * 0.95 },
    ],
    maxScroll,
  });

  assert.ok(
    withSubPage.some(stop => stop.sectionId === 'snap'),
    'the second category grid should be its own snap page',
  );
});

test('ساختار صفحه: هر دو شبکه‌ی دسته‌بندی زیرصفحه‌ی اسنپ دارند', () => {
  const snapMarkers = (categorySrc.match(/data-home-snap/g) ?? []).length;
  assert.equal(snapMarkers, 2, 'both category grids must be snap pages');
});

/* ────────────────────────────────────────────────────────────────────────── */
/* انتخاب مقصد هر حرکت چرخ ماوس                                                */
/* ────────────────────────────────────────────────────────────────────────── */

const stopTops = stops.map(stop => stop.top);

test('یک حرکت رو به پایین = دقیقاً یک بخش جلوتر', () => {
  const target = pickSnapDestination({
    stops: stopTops,
    scrollY: 0,
    direction: 1,
    viewportHeight: VIEWPORT,
  });

  assert.equal(target?.top, 900);
  assert.equal(target?.intercept, true);
});

test('یک حرکت رو به بالا = دقیقاً یک بخش عقب‌تر', () => {
  const target = pickSnapDestination({
    stops: stopTops,
    scrollY: 1800,
    direction: -1,
    viewportHeight: VIEWPORT,
  });

  assert.equal(target?.top, 900);
});

test('در بالاترین نقطه، اسکرول رو به بالا دست‌نخورده می‌ماند', () => {
  assert.equal(
    pickSnapDestination({
      stops: stopTops,
      scrollY: 0,
      direction: -1,
      viewportHeight: VIEWPORT,
    }),
    null,
  );
});

test('در ته صفحه، اسکرول رو به پایین دست‌نخورده می‌ماند', () => {
  assert.equal(
    pickSnapDestination({
      stops: stopTops,
      scrollY: maxScroll,
      direction: 1,
      viewportHeight: VIEWPORT,
    }),
    null,
  );
});

test('حرکت‌های پشت‌سرهم یک چرخ، بخش را بیش از یکی جلو نمی‌برند', () => {
  /*
   * یک حرکت فیزیکی چرخ ماوس چند رویداد پشت‌سرهم می‌فرستد. اگر هر رویداد
   * مبنای خودش را «وسط انیمیشن» بگیرد، ممکن است دو بخش جلو برود.
   *
   * این تست همان منطق را شبیه‌سازی می‌کند: تا وقتی مقصد قبلی محقق نشده
   * (scrollY عوض نشده)، مقصد همان مقصد قبلی است — نه بیشتر.
   */
  let scrollY = 0;
  const destinations: number[] = [];

  // رویداد اول
  const first = pickSnapDestination({
    stops: stopTops,
    scrollY,
    direction: 1,
    viewportHeight: VIEWPORT,
  });
  assert.ok(first);
  destinations.push(first.top);

  // رویدادهای بعدی همان حرکت؛ هنوز اسکرول شروع نشده
  for (let i = 0; i < 3; i += 1) {
    const again = pickSnapDestination({
      stops: stopTops,
      scrollY,
      direction: 1,
      viewportHeight: VIEWPORT,
    });
    if (again) destinations.push(again.top);
  }

  assert.deepEqual(new Set(destinations), new Set([900]));

  // بعد از رسیدن به مقصد، حرکت بعدی به بخش بعدی می‌رود
  scrollY = 900;
  assert.equal(
    pickSnapDestination({
      stops: stopTops,
      scrollY,
      direction: 1,
      viewportHeight: VIEWPORT,
    })?.top,
    1800,
  );
});

test('مقصد همیشه دقیقاً یکی از نقاط توقف است (بدون توقف نصفه‌کاره)', () => {
  for (let y = 0; y < maxScroll; y += 37) {
    for (const direction of [1, -1] as const) {
      const target = pickSnapDestination({
        stops: stopTops,
        scrollY: y,
        direction,
        viewportHeight: VIEWPORT,
      });

      if (target) {
        assert.ok(
          stopTops.includes(target.top),
          `target ${target.top} is not a snap stop (from ${y}, dir ${direction})`,
        );
      }
    }
  }
});

test('رو به بالا هرگز مقصدی پایین‌تر از موقعیت فعلی نمی‌دهد', () => {
  for (let y = 1; y < maxScroll; y += 53) {
    const target = pickSnapDestination({
      stops: stopTops,
      scrollY: y,
      direction: -1,
      viewportHeight: VIEWPORT,
    });

    if (target) assert.ok(target.top < y);
  }
});

test('رو به پایین هرگز مقصدی بالاتر از موقعیت فعلی نمی‌دهد', () => {
  for (let y = 0; y < maxScroll; y += 53) {
    const target = pickSnapDestination({
      stops: stopTops,
      scrollY: y,
      direction: 1,
      viewportHeight: VIEWPORT,
    });

    if (target) assert.ok(target.top > y);
  }
});

/* ────────────────────────────────────────────────────────────────────────── */
/* ساختار صفحه و بخش‌ها                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

test('هر بخش ثبت‌شده در ناوبری، یک المان واقعی روی صفحه دارد', () => {
  for (const section of HOME_SECTIONS as HomeSectionMeta[]) {
    const inPage =
      pageSrc.includes(section.id) ||
      heroSrc.includes(`id="${section.id}"`) ||
      categorySrc.includes(`id="${section.id}"`) ||
      bannerSrc.includes(`id="${section.id}"`) ||
      styleSrc.includes(`id="${section.id}"`) ||
      endSrc.includes(`id="${section.id}"`);

    assert.ok(inPage, `section ${section.id} has no matching element`);
  }

  // و همه‌ی آن‌ها به‌عنوان نقطه‌ی توقف علامت خورده‌اند
  const allSectionSources = [heroSrc, categorySrc, bannerSrc, styleSrc, endSrc];
  const markers = allSectionSources.flatMap(
    src => src.match(/data-home-section/g) ?? [],
  ).length;

  assert.ok(
    markers >= 6,
    `expected 6 snap sections, found ${markers} data-home-section markers`,
  );
});

test('کامپوننت تجربه‌ی اسکرول فقط در صفحه‌ی اصلی mount می‌شود', () => {
  assert.ok(pageSrc.includes('<HomeScrollExperience'));
  assert.ok(
    pageSrc.includes("from '@/components/pages/home/home-scroll-experience'"),
  );
});

test('کلاس اسکرول فقط در همان صفحه فعال و در unmount پاک می‌شود', () => {
  assert.ok(scrollSrc.includes("root.classList.add('home-scroll')"));
  assert.ok(scrollSrc.includes("root.classList.remove('home-scroll')"));
});

test('اسکرول اسنپ از proximity استفاده می‌کند تا فوتر و لنگرها گیر نکنند', () => {
  assert.match(cssSrc, /scroll-snap-type:\s*y proximity/);
  assert.doesNotMatch(cssSrc, /scroll-snap-type:\s*y mandatory/);
  assert.match(cssSrc, /scroll-snap-align:\s*start/);
});

test('ارتفاع بخش‌ها با svh حساب می‌شود و fallback هم دارد', () => {
  assert.match(cssSrc, /--zp-home-section-h:\s*100vh/);
  assert.ok(cssSrc.includes('@supports (height: 100svh)'));
  assert.match(cssSrc, /--zp-home-section-h:\s*100svh/);
});

test('پیمایش چرخ ماوس فقط در دسکتاپ فعال است', () => {
  assert.ok(scrollSrc.includes("matchMedia('(min-width: 64rem)')"));
  assert.ok(scrollSrc.includes("addEventListener('wheel'"));
});

test('listener چرخ ماوس فقط وقتی لازم است غیر passive است', () => {
  assert.ok(scrollSrc.includes('{ passive: false }'));
  // اسکرول و resize باید passive باشند
  assert.ok(
    scrollSrc.includes(
      "addEventListener('scroll', schedule, { passive: true })",
    ),
  );
  assert.ok(
    scrollSrc.includes(
      "addEventListener('resize', schedule, { passive: true })",
    ),
  );
});

test('بخش فعال با IntersectionObserver تشخیص داده می‌شود (نه scroll listener)', () => {
  assert.ok(scrollSrc.includes('new IntersectionObserver'));
  assert.ok(scrollSrc.includes('rootMargin:'));
});

test('نوار پیشرفت با rAF و transform به‌روزرسانی می‌شود', () => {
  assert.ok(scrollSrc.includes('requestAnimationFrame'));
  assert.ok(scrollSrc.includes('style.transform = `scaleX('));
  assert.match(cssSrc, /\.home-progress-fill[\s\S]*transform: scaleX\(0\)/);
  assert.match(cssSrc, /transform-origin: right center/);
});

test('احترام به prefers-reduced-motion در CSS و JS', () => {
  assert.ok(
    scrollSrc.includes("matchMedia('(prefers-reduced-motion: reduce)')"),
  );
  assert.match(cssSrc, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(cssSrc, /@media \(prefers-reduced-motion: no-preference\)/);
});

test('ناوبری دایره‌ای فقط دسکتاپ است و بعد از همه محتوا نمی‌آید', () => {
  // کلاس hidden + lg:block یعنی روی موبایل دیده نمی‌شود
  assert.ok(scrollSrc.includes('hidden -translate-y-1/2 lg:block'));
  assert.ok(scrollSrc.includes('aria-current'));
  assert.ok(scrollSrc.includes('aria-label="پیمایش بخش‌های صفحه اصلی"'));
});

test('هیچ بخشی با GSAP pin قفل نمی‌شود (علت اصلی تجربه‌ی قبلی)', () => {
  for (const src of [heroSrc, categorySrc, endSrc]) {
    assert.doesNotMatch(src, /\bpin:\s*true/);
  }
  // ScrollTrigger فقط برای انیمیشن تیترها (LuxuryTitle) باقی مانده است
  for (const src of [heroSrc, categorySrc, endSrc]) {
    assert.doesNotMatch(src, /from 'gsap\/ScrollTrigger'/);
    assert.doesNotMatch(src, /from 'gsap'/);
  }
});

test('هدر در صفحه‌ی اصلی چسبان می‌ماند و در بقیه صفحه‌ها رفتار قبلی', () => {
  assert.ok(headerSrc.includes("pathname === '/'"));
  assert.ok(headerSrc.includes("'-translate-y-full'"));
  assert.ok(headerSrc.includes('forceVisible || isVisible'));
});

/* ────────────────────────────────────────────────────────────────────────── */
/* اندازه‌گیری بنر و شبکه‌ها خودکار است (نه ارتفاع ثابت)                        */
/* ────────────────────────────────────────────────────────────────────────── */

test('بنر فروش با نسبت واقعی تصویر و سقف ارتفاع صفحه اندازه می‌شود', () => {
  assert.ok(bannerSrc.includes('home-media-frame'));
  assert.match(cssSrc, /aspect-ratio:\s*var\(--zp-frame-ratio/);
  assert.match(cssSrc, /max-width:\s*calc\(var\(--zp-home-free\)/);
  // نسخه‌ی موبایل با همان بریک‌پوینت <picture> عوض می‌شود
  assert.match(cssSrc, /@media \(max-width: 47\.999rem\)[\s\S]*0\.5625/);
});

test('ارتفاع هدر و فضای آزاد در همه‌ی محاسبات هست', () => {
  assert.match(
    cssSrc,
    /--zp-home-avail:\s*calc\(var\(--zp-home-section-h\) - var\(--zp-header-h\)\)/,
  );
  assert.match(cssSrc, /--zp-home-free:/);
  assert.ok(scrollSrc.includes("root.style.setProperty('--zp-header-h'"));
});

test('نوار ناوبری پایین موبایل از ارتفاع بخش‌ها کم می‌شود', () => {
  assert.ok(cssSrc.includes('env(safe-area-inset-bottom, 0px)'));
  assert.match(cssSrc, /--zp-home-free:[\s\S]*--zp-mobile-nav-h/);
});

test('هیچ ارتفاع ثابتی به همه‌ی بخش‌ها تحمیل نمی‌شود', () => {
  // ارتفاع فقط با مادیفایر صریح --full اعمال می‌شود
  assert.match(cssSrc, /\.home-section--full \{\s*height:/);
  assert.doesNotMatch(cssSrc, /^\.home-section \{[^}]*height:/m);
});

test('بخش‌های محتوایی (دسته‌بندی‌ها) به‌اندازه‌ی محتوا می‌مانند', () => {
  assert.doesNotMatch(categorySrc, /home-section--full/);
  assert.ok(categorySrc.includes('data-home-snap'));
});

test('New In دیگر داخل wrapper تمام‌صفحه‌ی تو‌در‌تو نیست', () => {
  // wrapper قبلی h-screen + absolute بود؛ الان هر بخش مستقیم تمام‌صفحه است
  assert.doesNotMatch(heroSrc, /min-h-screen/);
  assert.doesNotMatch(heroSrc, /sm:absolute/);
  assert.ok(newInSrc.includes('h-full'));
});

test('فوتر بخش اسنپ نیست (تا هندسه‌ی صفحه را به هم نزند)', () => {
  assert.ok(footerSrc.includes('id="site-footer"'));
  assert.doesNotMatch(footerSrc, /home-section/);
});

test('هیچ اسکرول‌لیسنر گران یا polling در کد نیست', () => {
  assert.doesNotMatch(scrollSrc, /setInterval\(/);
  // اسکرول فقط یک بار برای نوار پیشرفت ثبت می‌شود (با rAF)
  const scrollListeners = (scrollSrc.match(/addEventListener\('scroll'/g) ?? [])
    .length;
  assert.equal(scrollListeners, 1);
});

test('جابه‌جایی برنامه‌ای (کلیک دایره‌ها) با اسنپ تداخل نمی‌کند', () => {
  assert.ok(scrollSrc.includes("new Event('zp:home-nav')"));
  assert.ok(scrollSrc.includes("addEventListener('zp:home-nav'"));
  assert.ok(scrollSrc.includes('PROGRAMMATIC_GUARD_MS'));
});

test('دایره‌های ناوبری از کلیک‌پذیر و دسترس‌پذیرند', () => {
  const navBlock = scrollSrc.slice(scrollSrc.indexOf('<nav'));
  assert.ok(navBlock.includes('aria-label={section.label}'));
  assert.ok(navBlock.includes('aria-current'));
  assert.ok(navBlock.includes('title={section.label}'));
  assert.ok(navBlock.includes('type="button"'));
});
