import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

/**
 * بررسی ساختاریِ لندینگ: قواعد چیدمان تأییدشده باید در نسخهٔ ادغام‌شده
 * باقی مانده باشند و صفحه نباید فونت/استایل سراسری اضافه کند.
 */
const root = join(import.meta.dirname, '..');

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

const page = read('app/landing/blackfriday/page.tsx');
const pageCss = read('app/landing/blackfriday/blackfriday.module.css');
const seo = read('components/pages/blackfriday/black-friday-seo.tsx');
const discountsCss = read(
  'components/pages/blackfriday/biggest-discounts.module.css',
);
const collectionCss = read(
  'components/pages/blackfriday/product-collection.module.css',
);
const collection = read('components/pages/blackfriday/product-collection.tsx');
const categoriesCss = read(
  'components/pages/blackfriday/category-grid.module.css',
);
const grid = read('components/pages/blackfriday/category-grid.tsx');
const countdownCss = read('components/pages/blackfriday/countdown.module.css');
const scrollHintCss = read(
  'components/pages/blackfriday/scroll-hint.module.css',
);

test('landing renders inside the shared storefront shell', () => {
  assert.match(page, /import Footer from '@\/components\/layout\/public\/footer'/);
  assert.match(page, /<Footer \/>/);
  // هدر از layout مسیر می‌آید؛ صفحه نباید هدر دوم بسازد
  assert.doesNotMatch(page, /components\/layout\/public\/header/);
  assert.match(page, /pb-\[var\(--zp-mobile-nav-h\)\] lg:pb-0/);
  assert.match(pageCss, /padding-block-start:\s*var\(--zp-header-h\)/);
});

test('landing does not load its own fonts or global element styles', () => {
  for (const source of [page, pageCss, collectionCss]) {
    assert.doesNotMatch(source, /next\/font|@font-face|--font-persian/);
  }
  // تنها قاعدهٔ سراسری، اسکرول اسنپِ همین صفحه است و با کلاس محدود شده
  assert.match(pageCss, /:global\(html\.blackfriday-scroll\)/);
  assert.doesNotMatch(pageCss, /^\s*html\s*\{/m);
  assert.doesNotMatch(pageCss, /^\s*body\s*\{/m);
});

test('hero banner is removed; page starts with the following content', () => {
  // بنر بزرگ «BLACK FRIDAY» دیگر رندر نمی‌شود و کامپوننت هیرو هم نیست
  assert.doesNotMatch(page, /blackfriday\/hero/);
  assert.doesNotMatch(page, /<Hero/);
  assert.doesNotMatch(page, /hero-banner/);

  // ساختار صفحه و صفحه‌خوان از دست نمی‌رود: h1 واقعی (نامرئی) و میان‌بر
  // به فهرست محصولات روی خود صفحه است
  assert.match(page, /<h1[^>]*>[^<]+<\/h1>/);
  assert.match(page, /styles\.visuallyHidden/);
  assert.match(page, /href="#collection"/);

  // هدر عادی فروشگاه از layout مسیر می‌آید و دست‌نخورده است
  assert.doesNotMatch(page, /components\/layout\/public\/header/);
});

test('SEO article sits after the product listing and before the footer', () => {
  const collectionIndex = page.indexOf('<ProductCollection');
  const seoIndex = page.indexOf('<BlackFridaySeo');
  const footerIndex = page.indexOf('<Footer');

  assert.ok(collectionIndex > -1, 'product collection must be rendered');
  assert.ok(seoIndex > collectionIndex, 'SEO section must follow products');
  assert.ok(footerIndex > seoIndex, 'SEO section must precede the footer');

  // متن کامل در HTML است (بدون دریافت جداگانه) و دکمه وضعیت را اعلام می‌کند
  assert.match(seo, /aria-expanded/);
  assert.match(seo, /aria-controls="bf-seo-more"/);
  assert.match(seo, /مشاهده بیشتر/);
  assert.match(seo, /بستن/);
  assert.match(seo, /hidden=\{!expanded\}/);
  assert.match(seo, /سؤالات متداول/);
});

test('biggest discounts keeps 6 desktop / 4 mobile cards', () => {
  assert.match(discountsCss, /grid-template-columns:\s*repeat\(3,/);
  assert.match(discountsCss, /grid-template-columns:\s*repeat\(2,/);
  assert.match(discountsCss, /grid-template-rows:\s*1fr 1fr/);
  assert.match(discountsCss, /:nth-child\(n \+ 5\)/);
  assert.match(discountsCss, /display:\s*none/);
});

test('product collection keeps the approved grid and infinite scroll marker', () => {
  assert.match(collectionCss, /grid-template-columns:\s*repeat\(4,/);
  assert.match(collectionCss, /@media \(max-width: 1199px\)[\s\S]*repeat\(3,/);
  assert.match(collectionCss, /@media \(max-width: 767px\)[\s\S]*repeat\(2,/);
  assert.match(collectionCss, /scroll-margin-top:\s*var\(--zp-header-h\)/);
  assert.match(collection, /sentinelRef/);
  assert.match(collection, /blackFridayCategoryHref|ProductCard/);
});

test('desktop uses five curated tiles while mobile keeps its existing grid', () => {
  assert.match(categoriesCss, /grid-template-columns:\s*repeat\(4,/);
  assert.match(categoriesCss, /@media \(min-width: 768px\)[\s\S]*?\.desktopGrid\s*\{[^}]*grid-template-columns:\s*repeat\(5,/);
  assert.match(page, /desktopCategories=\{resolveBlackFridaySubcategories/);
  assert.match(page, /topCategories=\{topCategories\}/);
  assert.match(categoriesCss, /aspect-ratio:\s*3 \/ 4/);
  assert.match(categoriesCss, /grid-column:\s*1 \/ -1/);
});

test('mobile category tiles keep a fixed ratio instead of stretching with the viewport height', () => {
  const mobile = categoriesCss.slice(
    categoriesCss.indexOf('@media (max-width: 767px)'),
  );
  const desktop = categoriesCss.slice(
    categoriesCss.indexOf('@media (min-width: 768px)'),
    categoriesCss.indexOf('@media (max-width: 767px)'),
  );

  // کارت‌های نیم‌عرض مربع‌اند (تصاویر CMS دسته‌ها ۱:۱ آپلود می‌شوند)
  assert.match(mobile, /\.card\s*\{[^}]*aspect-ratio:\s*1 \/ 1/);
  // بخش دیگر ارتفاع ثابت 100dvh ندارد که کارت‌ها را کش بدهد
  assert.match(
    mobile,
    /min-height:\s*calc\(100dvh - var\(--zp-header-h\) - var\(--zp-mobile-nav-h\)\)/,
  );
  assert.doesNotMatch(mobile, /(^|[^-])height:\s*calc\(100dvh/m);
  assert.doesNotMatch(mobile, /\.grid li,\s*\.card\s*\{[^}]*height:\s*100%/);
  // کارت تمام‌عرض: تصویر کامل (contain) و کف ارتفاع وابسته به عرض
  assert.match(mobile, /\.imageFeatured\s*\{[^}]*object-fit:\s*contain/);
  assert.match(mobile, /grid-template-rows:\s*minmax\(max\(8\.5rem, calc\(\(100vw - 1\.5rem\) \/ 2\.4\)\), 1fr\)/);

  // دسکتاپ دست‌نخورده می‌ماند
  assert.doesNotMatch(desktop, /aspect-ratio|imageFeatured|backdrop/);
  assert.match(grid, /<ul className=\{`\$\{styles\.grid\} \$\{styles\.desktopGrid\}`\}>[\s\S]*sizes="\(min-width: 768px\) 20vw, 50vw"/);
  // کارت اول موبایل تمام‌عرض است و تصویر با کیفیت کافی برایش انتخاب می‌شود
  assert.match(grid, /featured \? '100vw' : '50vw'/);
});

test('countdown keeps four units and the mobile full-height layout', () => {
  assert.match(countdownCss, /grid-template-columns:\s*repeat\(4,/);
  assert.match(
    countdownCss,
    /calc\(100dvh - var\(--zp-header-h\) - var\(--zp-mobile-nav-h\)\)/,
  );
});

test('scroll hint sits above the mobile bottom navigation', () => {
  assert.match(
    scrollHintCss,
    /bottom:\s*calc\(var\(--zp-mobile-nav-h\) \+ 0\.75rem\)/,
  );
});

test('desktop filters panel stays sharp above a non-blurring backdrop while mobile sheet stays untouched', () => {
  // شیت موبایل فقط در عرض‌های غیردسکتاپ باز می‌شود تا SheetOverlay (که
  // backdrop-blur دارد و lg:hidden ندارد) روی دسکتاپ صفحه و پنل را تار نکند
  assert.match(collection, /<Sheet\s+open=\{!isDesktop && filtersOpen\}/);
  assert.match(collection, /matchMedia\('\(min-width: 1024px\)'\)/);

  // پنل دسکتاپ: بستن صریح، اعمال فیلترها، جلوگیری از انتشار رویداد به backdrop
  assert.match(collection, /id="bf-filters"/);
  assert.match(collection, /aria-label="بستن فیلترها"/);
  assert.match(collection, /اعمال فیلترها/);
  assert.match(collection, /event\.stopPropagation\(\)/);

  // لایه‌بندی دسکتاپ: backdrop بدون blur در z-index: 35 و پنل بالاتر از آن در z-index: 36
  assert.match(
    collectionCss,
    /@media \(min-width: 1024px\)[\s\S]*?\.panelBackdrop\s*\{[^}]*z-index:\s*35/,
  );
  assert.match(
    collectionCss,
    /@media \(min-width: 1024px\)[\s\S]*?\.panelOpen\s*\{[^}]*z-index:\s*36[\s\S]*?pointer-events:\s*auto/,
  );
  assert.doesNotMatch(collectionCss, /backdrop-filter|filter:\s*blur/);

  // نسخهٔ موبایل دست‌نخورده باقی مانده است
  assert.match(collection, /side="bottom"/);
  assert.match(collection, /lg:hidden/);
});
