import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import {
  activeStopIndex,
  buildSnapStops,
  stepStopIndex,
  stopIndexAt,
} from '../components/pages/home/home-scroll-experience';
import {
  HOME_FOOTER_ID,
  HOME_NAV_ITEMS,
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
const productCardSrc = source('components/shared/product-card.tsx');
const homeImageSrc = source('components/shared/home-image.tsx');
const layoutSrc = source('app/(public)/layout.tsx');

/* ────────────────────────────────────────────────────────────────────────── */
/* نقاط توقف                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const VIEWPORT = 900;

/** پنج بخش تمام‌صفحه، دو صفحه‌ی دسته‌بندی و یک ویدیوی پایانی */
const sections = [
  { id: 'home-sale', top: 0, height: VIEWPORT },
  { id: 'home-new-in', top: 900, height: VIEWPORT },
  { id: 'home-hero', top: 1800, height: VIEWPORT },
  { id: 'home-categories', top: 2700, height: VIEWPORT * 2 },
  { id: 'home-categories', top: 3600, height: VIEWPORT },
  { id: 'home-style', top: 4500, height: VIEWPORT },
  { id: 'home-end', top: 5400, height: VIEWPORT },
];

const documentHeight = 5400 + VIEWPORT + 700; // + فوتر ۷۰۰px
const maxScroll = documentHeight - VIEWPORT;

const stops = buildSnapStops({ sections, maxScroll });
const stopTops = stops.map(stop => stop.top);

test('هر بخش اصلی یک نقطه‌ی توقف دارد', () => {
  for (const section of sections) {
    assert.ok(
      stops.some(stop => stop.sectionId === section.id),
      `missing snap stop for ${section.id}`,
    );
  }
});

test('ابتدای هر بخش روی پیکسل دقیق خودش است (نه وسط راه)', () => {
  const unique = [
    ...new Map(
      sections
        .filter(item => item.id !== 'home-categories')
        .map(item => [item.id, item]),
    ).values(),
  ];

  for (const section of unique) {
    const stop = stops.find(item => item.sectionId === section.id);
    assert.equal(stop?.top, section.top);
  }
});

test('هر دو صفحه‌ی دسته‌بندی توقف جدا دارند و هر دو به بخش دسته‌بندی وصل‌اند', () => {
  const categoryStops = stops.filter(
    stop => stop.sectionId === 'home-categories',
  );

  assert.equal(categoryStops.length, 2);
  assert.deepEqual(
    categoryStops.map(stop => stop.top),
    [2700, 3600],
  );
});

test('ته صفحه همیشه آخرین نقطه‌ی توقف است تا فوتر کامل دیده شود', () => {
  const last = stops.at(-1);
  assert.equal(last?.isFooter, true);
  assert.equal(last?.sectionId, HOME_FOOTER_ID);
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

test('فوتر با ارتفاع طبیعی و بدون کشیدن به تمام صفحه، مقصد جدا دارد', () => {
  assert.equal(stops.at(-1)?.top, maxScroll);
  assert.ok(!footerSrc.includes('home-section'));
  assert.ok(footerSrc.includes('id="site-footer"'));
  assert.match(
    cssSrc,
    /html\.home-scroll #site-footer\s*\{[^}]*scroll-snap-align:\s*end/,
  );
});

test('اگر فوتر از یک صفحه بلندتر باشد، مقصدش ابتدای فوتر است (نه ته صفحه)', () => {
  const tallFooterTop = maxScroll - 250;
  const tall = buildSnapStops({
    sections,
    maxScroll,
    footerTop: tallFooterTop,
  });

  assert.equal(tall.at(-1)?.isFooter, true);
  assert.equal(tall.at(-1)?.top, tallFooterTop);
});

/* ────────────────────────────────────────────────────────────────────────── */
/* یک حرکت = یک بخش                                                            */
/* ────────────────────────────────────────────────────────────────────────── */

test('یک حرکت رو به پایین = دقیقاً یک توقف جلوتر', () => {
  assert.equal(
    stepStopIndex(stops, { fromIndex: 0, direction: 1 }),
    1,
  );
  assert.equal(
    stepStopIndex(stops, { fromIndex: 3, direction: 1 }),
    4,
  );
});

test('یک حرکت رو به بالا = دقیقاً یک توقف عقب‌تر', () => {
  assert.equal(
    stepStopIndex(stops, { fromIndex: 4, direction: -1 }),
    3,
  );
});

test('در بالاترین/پایین‌ترین نقطه مقصدی وجود ندارد و اسکرول طبیعی می‌ماند', () => {
  assert.equal(stepStopIndex(stops, { fromIndex: 0, direction: -1 }), null);
  assert.equal(
    stepStopIndex(stops, { fromIndex: stops.length - 1, direction: 1 }),
    null,
  );
});

test('هیچ حرکتی بیش از یک توقف جابه‌جا نمی‌کند', () => {
  let index = 0;

  for (let i = 0; i < 20; i += 1) {
    const next = stepStopIndex(stops, { fromIndex: index, direction: 1 });

    if (next === null) break;

    assert.equal(next, index + 1);
    index = next;
  }

  assert.equal(index, stops.length - 1);
});

test('مقصد همیشه دقیقاً یکی از نقاط توقف است', () => {
  for (let index = 0; index < stops.length; index += 1) {
    for (const direction of [1, -1] as const) {
      const next = stepStopIndex(stops, { fromIndex: index, direction });

      if (next !== null) {
        assert.ok(stopTops.includes(stops[next].top));
      }
    }
  }
});

/* ────────────────────────────────────────────────────────────────────────── */
/* موقعیت و بخش فعال                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

test('موقعیت فعلی با آخرین توقفِ ردشده تشخیص داده می‌شود', () => {
  assert.equal(stopIndexAt(stops, 0), 0);
  assert.equal(stopIndexAt(stops, 890), 0);
  assert.equal(stopIndexAt(stops, 900), 1);
  assert.equal(stopIndexAt(stops, 1801), 2);
});

test('دایره‌ی فعال از موقعیت واقعی اسکرول حساب می‌شود', () => {
  const activeAt = (scrollY: number) =>
    stops[
      activeStopIndex(stops, {
        scrollY,
        maxScroll,
        viewportHeight: VIEWPORT,
      })
    ]?.sectionId;

  assert.equal(activeAt(0), 'home-sale');
  assert.equal(activeAt(900), 'home-new-in');
  assert.equal(activeAt(1800), 'home-hero');
  assert.equal(activeAt(2700), 'home-categories');
  assert.equal(activeAt(3600), 'home-categories');
  assert.equal(activeAt(4500), 'home-style');
  assert.equal(activeAt(5400), 'home-end');
});

test('در ته صفحه دایره‌ی فوتر فعال می‌شود', () => {
  const index = activeStopIndex(stops, {
    scrollY: maxScroll,
    maxScroll,
    viewportHeight: VIEWPORT,
  });

  assert.equal(stops[index]?.isFooter, true);
  assert.equal(stops[index]?.sectionId, HOME_FOOTER_ID);
});

test('دایره‌ی فعال هیچ‌وقت از محدوده‌ی نقاط توقف بیرون نمی‌زند', () => {
  for (let y = 0; y <= maxScroll; y += 37) {
    const index = activeStopIndex(stops, {
      scrollY: y,
      maxScroll,
      viewportHeight: VIEWPORT,
    });

    assert.ok(index >= 0 && index < stops.length);
  }
});

/* ────────────────────────────────────────────────────────────────────────── */
/* ساختار صفحه و بخش‌ها                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

test('ترتیب DOM و ناوبری صفحه اصلی: SaleBanner، سپس New In (Black Friday) و بعد Hero (۲ ویدیو)', () => {
  assert.ok(
    pageSrc.indexOf('<SaleBanner') < pageSrc.indexOf('<HeroNewInTransition'),
  );
  assert.ok(heroSrc.indexOf('<NewIn') < heroSrc.indexOf('<HeroSection'));
  assert.ok(
    heroSrc.indexOf('id="home-new-in"') < heroSrc.indexOf('id="home-hero"'),
  );
  assert.deepEqual(
    HOME_SECTIONS.slice(0, 3).map(section => section.id),
    ['home-sale', 'home-new-in', 'home-hero'],
  );
});

test('هر بخش ثبت‌شده در ناوبری یک المان واقعی روی صفحه دارد', () => {
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

  const allSectionSources = [heroSrc, categorySrc, bannerSrc, styleSrc, endSrc];
  const markers = allSectionSources.flatMap(
    src => src.match(/data-home-section/g) ?? [],
  ).length;

  assert.ok(
    markers >= 6,
    `expected 6 snap sections, found ${markers} data-home-section markers`,
  );
});

test('فوتر یک مقصد مستقل در ناوبری دایره‌هاست', () => {
  assert.ok(
    HOME_NAV_ITEMS.some(
      item => item.id === HOME_FOOTER_ID && item.isFooter === true,
    ),
  );
  assert.ok(scrollSrc.includes('HOME_NAV_ITEMS'));
  assert.ok(scrollSrc.includes('document.getElementById(HOME_FOOTER_ID)'));
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

test('اسنپ دسکتاپ proximity و موبایل mandatory است', () => {
  assert.match(
    cssSrc,
    /html\.home-scroll\s*\{\s*scroll-snap-type:\s*y proximity/,
  );
  assert.match(
    cssSrc,
    /@media \(max-width: 63\.999rem\)[\s\S]*html\.home-scroll\s*\{\s*scroll-snap-type:\s*y mandatory/,
  );
  assert.match(cssSrc, /scroll-snap-align:\s*start/);
  assert.match(cssSrc, /scroll-snap-stop:\s*always/);
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
  assert.ok(
    scrollSrc.includes(
      "addEventListener('scroll', schedule, { passive: true })",
    ),
  );
});

test('بخش فعال از موقعیت اسکرول حساب می‌شود، نه از IntersectionObserver', () => {
  assert.ok(scrollSrc.includes('activeStopIndex'));
  assert.ok(!scrollSrc.includes('new IntersectionObserver'));
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

test('هیچ بخشی با GSAP pin قفل نمی‌شود', () => {
  for (const src of [heroSrc, categorySrc, endSrc]) {
    assert.doesNotMatch(src, /\bpin:\s*true/);
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
/* بنر تمام‌عرض و اسلایدهای دسته‌بندی                                          */
/* ────────────────────────────────────────────────────────────────────────── */

test('بنر فروش تمام عرض است و قاب وسط‌چین با سقف عرض ندارد', () => {
  assert.ok(bannerSrc.includes('home-section--full'));
  assert.ok(bannerSrc.includes('home-section--below-header'));
  assert.ok(bannerSrc.includes('relative block h-full w-full'));
  assert.ok(bannerSrc.includes('<HomeImage'));
  assert.ok(bannerSrc.includes('mobileMedia="(max-width: 1023px)"'));
  assert.ok(!bannerSrc.includes('home-media-frame'));
  assert.doesNotMatch(cssSrc, /\.home-media-frame/);
  assert.doesNotMatch(cssSrc, /max-width:\s*calc\(/);
});

test('هر دو صفحه‌ی دسته‌بندی تمام‌ارتفاع، تمام‌عرض و اسنپ‌پذیرند', () => {
  const slides = (categorySrc.match(/<CategorySlide/g) ?? []).length;
  assert.equal(slides, 2, 'both category slides must be snap pages');

  assert.ok(categorySrc.includes('data-home-snap'));
  assert.ok(categorySrc.includes('data-home-snap-id="home-categories"'));

  assert.match(
    cssSrc,
    /\.home-category-slide\s*\{[^}]*height:\s*var\(--zp-home-section-h\)/,
  );
  assert.match(
    cssSrc,
    /\.home-category-slide\s*\{[^}]*padding-block-start:\s*var\(--zp-header-h\)/,
  );
  assert.ok(!categorySrc.includes('home-square-grid'));
  assert.ok(!categorySrc.includes('mx-auto'));
});

test('دسکتاپ: رسانه مرکزی تمام‌ارتفاع و خانه‌ها در دو ستون کناری عمودی', () => {
  assert.match(
    cssSrc,
    /grid-template-columns:\s*clamp\([\s\S]*grid-template-rows:\s*repeat\(2/,
  );
  assert.match(
    cssSrc,
    /\.home-category-media\s*\{[^}]*grid-row:\s*1 \/ span 2/,
  );
  for (const position of ['start-1', 'start-2', 'end-1', 'end-2']) {
    assert.ok(categorySrc.includes(`home-category-tile--${position}`));
    assert.ok(cssSrc.includes(`.home-category-tile--${position}`));
  }
});

test('چیدمان موبایل بدون عرض ثابت و بدون اسکرول افقی است', () => {
  assert.match(
    cssSrc,
    /\.home-category-layout\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
  );
  assert.match(
    cssSrc,
    /@media \(max-width: 63\.999rem\)[\s\S]*\.home-category-slide\s*\{[^}]*height:\s*var\(--zp-home-section-h\)/,
  );
  assert.match(
    cssSrc,
    /@media \(max-width: 39\.999rem\)[\s\S]*\.home-category-media--first\s*\{[^}]*display:\s*none/,
  );
  // رسانه دیگر تمام‌قاب و پشت خانه‌ها نیست
  assert.doesNotMatch(cssSrc, /\.home-category-media\s*\{[^}]*position:\s*absolute/);
  assert.doesNotMatch(cssSrc, /inset-block:\s*var\(--zp-header-h\)/);
});

test('اسلاید ۴ و ۵ در موبایل: رسانه‌ی ۱۶:۹ بالای خانه‌های دسته‌بندی', () => {
  // فقط بلوک CSS دسته‌بندی‌ها (بین دو نشانگر بخش) بررسی می‌شود
  const mobileBlock = cssSrc
    .slice(cssSrc.indexOf('دسته‌بندی‌ها: دو صفحه'), undefined)
    .slice(0, cssSrc.indexOf('New In در موبایل') - cssSrc.indexOf('دسته‌بندی‌ها: دو صفحه'));

  assert.ok(mobileBlock.length > 0, 'category css block must exist');

  // ردیف اول با ارتفاع خودکار (از نسبت ۱۶:۹) و دو ردیف خانه زیرش
  assert.match(
    mobileBlock,
    /\.home-category-layout\s*\{[^}]*grid-template-rows:\s*auto minmax\(0, 1fr\) minmax\(0, 1fr\)/,
  );
  // نسبت افقی ۱۶:۹ برای تصویر و ویدیو
  assert.match(
    mobileBlock,
    /\.home-category-media\s*\{[^}]*aspect-ratio:\s*16 \/ 9/,
  );
  // رسانه در ردیف اول و هم‌تراز بالا (نه کشیده به ارتفاع ردیف)
  assert.match(mobileBlock, /\.home-category-media\s*\{[^}]*grid-row:\s*1/);
  assert.match(mobileBlock, /\.home-category-media\s*\{[^}]*align-self:\s*start/);
  // حاشیه‌ی افقی متقارن روی خود اسلاید
  assert.match(
    mobileBlock,
    /\.home-category-slide\s*\{[^}]*padding-inline:\s*clamp\(/,
  );
  // فاصله‌ی عمودی بین رسانه و شبکه‌ی خانه‌ها
  assert.match(mobileBlock, /\.home-category-layout\s*\{[^}]*row-gap:/);
  // ترتیب خانه‌ها همان ترتیب قبلی است (۲×۲ زیر رسانه)
  assert.match(mobileBlock, /\.home-category-tile--start-1\s*\{[^}]*grid-row:\s*2/);
  assert.match(mobileBlock, /\.home-category-tile--start-2\s*\{[^}]*grid-row:\s*2/);
  assert.match(mobileBlock, /\.home-category-tile--end-1\s*\{[^}]*grid-row:\s*3/);
  assert.match(mobileBlock, /\.home-category-tile--end-2\s*\{[^}]*grid-row:\s*3/);
  // برش با cover و نقطه‌ی تمرکز مشخص، نه کشیدگی
  assert.match(mobileBlock, /object-position:\s*center 35%/);
  // روی گوشی، همان رسانه‌ی دوم تمام عرض ردیف اول را می‌گیرد
  assert.match(
    cssSrc,
    /@media \(max-width: 39\.999rem\)[\s\S]*\.home-category-media--second\s*\{[^}]*grid-column:\s*1 \/ -1/,
  );
});

test('برچسب خانه‌های دسته‌بندی همیشه دیده می‌شود (نه فقط hover)', () => {
  assert.ok(categorySrc.includes('bg-white/90'));
  assert.ok(categorySrc.includes('group-hover:scale-[1.03]'));
  assert.doesNotMatch(categorySrc, /opacity-0/);
  assert.doesNotMatch(categorySrc, /group-hover:opacity-100/);
});

/* ────────────────────────────────────────────────────────────────────────── */
/* بازگشت به ابتدا و دسترس‌پذیری                                               */
/* ────────────────────────────────────────────────────────────────────────── */

test('دکمه‌ی بازگشت به ابتدا از بخش دوم به بعد با aria-label دیده می‌شود', () => {
  assert.ok(scrollSrc.includes('const showBackToTop = activeIndex > 0;'));
  assert.ok(scrollSrc.includes('{showBackToTop && sections[0] && ('));
  assert.ok(scrollSrc.includes('aria-label="بازگشت به ابتدای صفحه"'));
  assert.ok(scrollSrc.includes('<ArrowUp'));
  assert.ok(scrollSrc.includes('goToSection(sections[0].id)'));
  assert.ok(scrollSrc.includes('home-back-to-top'));
  assert.match(
    cssSrc,
    /\.home-back-to-top\s*\{[^}]*bottom:\s*calc\(var\(--zp-mobile-nav-h\) \+ 1rem\)/,
  );
});

test('دایره‌های ناوبری از کلیک‌پذیر و دسترس‌پذیرند', () => {
  const navBlock = scrollSrc.slice(scrollSrc.indexOf('<nav'));
  assert.ok(navBlock.includes('aria-label={section.label}'));
  assert.ok(navBlock.includes('aria-current'));
  assert.ok(navBlock.includes('title={section.label}'));
  assert.ok(navBlock.includes('type="button"'));
});

test('دایره‌ها و چرخ ماوس از یک منبع مقصد استفاده می‌کنند', () => {
  assert.ok(scrollSrc.includes('const goToSection = (id: string)'));
  assert.ok(scrollSrc.includes('list.findIndex(stop => stop.sectionId === id)'));
  assert.ok(scrollSrc.includes('stopIndexAt(list, window.scrollY)'));
  assert.ok(scrollSrc.includes('const stops = () =>'));
});

test('هیچ اسکرول‌لیسنر گران یا polling در کد نیست', () => {
  assert.doesNotMatch(scrollSrc, /setInterval\(/);
  const scrollListeners = (scrollSrc.match(/addEventListener\('scroll'/g) ?? [])
    .length;
  assert.equal(scrollListeners, 1);
});

test('New In دیگر داخل wrapper تمام‌صفحه‌ی تو‌در‌تو نیست', () => {
  assert.doesNotMatch(heroSrc, /min-h-screen/);
  assert.doesNotMatch(heroSrc, /sm:absolute/);
  assert.ok(newInSrc.includes('h-full'));
});

test('هیچ ارتفاع ثابتی به همه‌ی بخش‌ها تحمیل نمی‌شود', () => {
  assert.match(cssSrc, /\.home-section--full \{\s*height:/);
  assert.doesNotMatch(cssSrc, /^\.home-section \{[^}]*height:/m);
});


/* ────────────────────────────────────────────────────────────────────────── */
/* تجربه‌ی موبایل: New In، استایل، فوتر و کنترل‌های شناور                       */
/* ────────────────────────────────────────────────────────────────────────── */

test('New In در موبایل فقط یک کارت مربع نشان می‌دهد', () => {
  assert.match(newInSrc, /perView:\s*1/);
  assert.doesNotMatch(newInSrc, /perView:\s*2/);
  assert.ok(newInSrc.includes('home-new-in-stage'));
  assert.ok(newInSrc.includes('home-new-in-card'));
  assert.ok(newInSrc.includes('squareImageOnMobile'));
  assert.ok(productCardSrc.includes('data-product-card'));
  assert.ok(productCardSrc.includes('home-product-image--square-mobile'));
  assert.match(
    cssSrc,
    /\.home-product-image--square-mobile\s*\{[^}]*aspect-ratio:\s*1/,
  );
  assert.match(
    cssSrc,
    /\.home-new-in-stage\s*\{[^}]*padding-inline:\s*var\(--zp-side-clear\)/,
  );
  assert.ok(newInSrc.includes('prefers-reduced-motion: reduce'));
});

test('New In کارت را با ارتفاع صفحه محدود می‌کند تا کامل بماند', () => {
  assert.match(cssSrc, /container-type:\s*size/);
  assert.match(cssSrc, /width:\s*min\(100%, calc\(100cqh - 7rem\)\)/);
  assert.match(cssSrc, /--zp-side-clear:\s*clamp\(3\.5rem, 14vw, 4\.25rem\)/);
});

test('پیشنهاد استایل در موبایل: ویدیوی ۱۶:۹ بالای کارت مربعی محصول', () => {
  assert.ok(styleSrc.includes('home-style-panel'));
  assert.ok(styleSrc.includes('home-style-video-panel'));
  assert.ok(styleSrc.includes('home-style-slider'));
  assert.ok(styleSrc.includes('home-style-slide-image'));
  assert.ok(styleSrc.includes('home-style-slide-label'));
  assert.ok(styleSrc.includes('home-style-control'));
  assert.match(
    cssSrc,
    /@media \(max-width: 39\.999rem\)[\s\S]*#home-style \.home-style-stage\s*\{[^}]*flex-direction:\s*column/,
  );
  // ویدیو: ارتفاع = عرض × ۹/۱۶ ⇒ افقی ۱۶:۹
  assert.match(
    cssSrc,
    /--zp-style-video-h:\s*calc\(var\(--zp-style-media-w\) \* 9 \/ 16\)/,
  );
  assert.match(
    cssSrc,
    /#home-style \.home-style-video-panel\s*\{[^}]*width:\s*var\(--zp-style-media-w\)[^}]*height:\s*var\(--zp-style-video-h\)/,
  );
  // کارت محصول: مربع ۱:۱
  assert.match(
    cssSrc,
    /#home-style \.home-style-slider\s*\{[^}]*width:\s*var\(--zp-style-media-w\)[^}]*height:\s*var\(--zp-style-media-w\)/,
  );
  // هیچ پنل مربعیِ قدیمی نمانده باشد
  assert.doesNotMatch(cssSrc, /--zp-style-panel/);
  assert.match(
    cssSrc,
    /#home-style \.home-style-control\s*\{[^}]*top:\s*calc/,
  );
});

test('عنوان نمایشی بخش New In به Black Friday تغییر یافته و ساختار داده ثابت است', () => {
  assert.match(newInSrc, /Black Friday/);
  assert.doesNotMatch(newInSrc, /New In/);
  assert.ok(newInSrc.includes('products.map'));
  assert.ok(newInSrc.includes('useKeenSlider'));
  assert.ok(newInSrc.includes('discount={discount}'));
  assert.ok(newInSrc.includes('promotionBadge={product.product.promotionBadge'));
  assert.ok(newInSrc.includes('extraDiscountBadge={'));
});

test('کاروسل محصولات در موبایل دقیقاً یک کارت کامل نشان می‌دهد', () => {
  // استایل پایهٔ keen-slider (flex, flex-direction: row-reverse در RTL, touch-action: pan-y)
  assert.ok(styleSrc.includes("import 'keen-slider/keen-slider.min.css';"));
  // حالت snap تا هر ورق زدن دقیقاً یک اسلاید جلو/عقب برود
  assert.match(styleSrc, /mode:\s*'snap'/);
  // پیش‌فرض (موبایل): یک اسلاید در هر نما و بدون فاصله ⇒ بدون سرکِ کارت بعدی
  assert.match(styleSrc, /perView:\s*1,\s*spacing:\s*0,\s*origin:\s*'auto'/);
  // از ۶۴۰px به بالا همان چیدمان قبلی برمی‌گردد (دسکتاپ دست‌نخورده)
  assert.match(
    styleSrc,
    /'\(min-width: 640px\)':\s*\{\s*slides:\s*\{\s*perView:\s*'auto',\s*spacing:\s*2,\s*origin:\s*'auto'\s*\}/,
  );
  // اسلایدها بدون !important که استایل اینلاین Keen را در تغییر بریک‌پوینت خراب کند
  assert.match(
    cssSrc,
    /#home-style \.home-style-slide\s*\{[^}]*flex:\s*0 0 100%;[^}]*width:\s*100%;[^}]*min-width:\s*100%;[^}]*max-width:\s*100%;/,
  );
  assert.doesNotMatch(
    cssSrc,
    /#home-style \.home-style-slide\s*\{[^}]*!important/,
  );
  // حذف حداقل عرضِ ثابت موبایل تا Keen هندسه را از عرض واقعی کانتینر بگیرد.
  assert.match(
    styleSrc,
    /w-full shrink-0 min-w-0! sm:w-auto sm:min-w-\[45vw\]!/,
  );
  assert.ok(styleSrc.includes('useSliderResize(sliderRef, instanceRef)'));
  assert.ok(styleSrc.includes('ref={resizeRef}'));
});

test('فوتر موبایل فشرده، اسنپ‌پذیر و بالای نوار پایین است', () => {
  assert.match(
    cssSrc,
    /html\.home-scroll #site-footer\s*\{[^}]*scroll-snap-align:\s*end/,
  );
  assert.match(
    cssSrc,
    /html\.home-scroll #site-footer\s*\{[^}]*scroll-margin-bottom:\s*var\(--zp-mobile-nav-h\)/,
  );
  assert.match(
    cssSrc,
    /html\.home-scroll #site-footer\s*\{[^}]*max-height:\s*calc/,
  );
  assert.match(
    cssSrc,
    /html\.home-scroll #site-footer\s*\{[^}]*overflow-y:\s*auto/,
  );
  assert.ok(footerSrc.includes('footer-columns'));
  assert.ok(footerSrc.includes('footer-group--about'));
  assert.ok(footerSrc.includes('footer-enamad--trust'));
  assert.ok(layoutSrc.includes('pb-[var(--zp-mobile-nav-h)]'));
});

test('بنر موبایل از تصویر مخصوص موبایل و برش object-cover استفاده می‌کند', () => {
  assert.ok(homeImageSrc.includes('image.mobile &&'));
  assert.ok(homeImageSrc.includes('(max-width: 767px)'));
  assert.ok(homeImageSrc.includes('mobileMedia'));
  assert.ok(homeImageSrc.includes('object-cover'));
  assert.ok(bannerSrc.includes('h-full w-full'));
});

test('کنترل‌های شناور گوشه‌ها روی کارت New In نمی‌افتند', () => {
  assert.match(cssSrc, /--zp-float-clear:\s*5rem/);
  assert.match(cssSrc, /--zp-side-clear:\s*clamp\(3\.5rem, 14vw, 4\.25rem\)/);
  assert.ok(newInSrc.includes('home-new-in-stage'));
  assert.ok(
    newInSrc.includes(
      'className="home-new-in-stage group relative min-h-0 flex-1 sm:px-0"',
    ),
  );
  assert.match(
    cssSrc,
    /\.ramonai-widget-host\[data-open='false'\]\s*\{[^}]*bottom:\s*calc\(var\(--zp-mobile-nav-h\)/,
  );
});
