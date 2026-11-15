import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

/**
 * تستِ انطباقِ `app/robots.txt` با متادیتای صفحات.
 *
 * چرا این تست وجود دارد: اگر مسیری هم در robots.txt با `Disallow` مسدود شود و
 * هم در کد متای `noindex` داشته باشد، خزنده صفحه را نمی‌خزد، متا را نمی‌بیند
 * و آدرسِ بدون محتوا می‌تواند در نتایج باقی بماند (URL-only indexing). این
 * تست جلوی بازگشتِ آن وضعیت را می‌گیرد و در عین حال تضمین می‌کند مسیرهای
 * حساس (داشبورد، ادمین، ورود، مقایسه، تسویه‌حساب) همچنان `noindex` دارند.
 */

const APP_DIR = join(process.cwd(), 'app');

const robotsTxt = readFileSync(join(APP_DIR, 'robots.txt'), 'utf8');

/** خط‌های `Disallow:` را به آرایه تبدیل می‌کند. */
function disallowedPrefixes(): string[] {
  return robotsTxt
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.toLowerCase().startsWith('disallow:'))
    .map(line => line.slice(line.indexOf(':') + 1).trim())
    .filter(Boolean);
}

/** خط‌های `Allow:` را به آرایه تبدیل می‌کند. */
function allowedPrefixes(): string[] {
  return robotsTxt
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.toLowerCase().startsWith('allow:'))
    .map(line => line.slice(line.indexOf(':') + 1).trim())
    .filter(Boolean);
}

/**
 * مسیرهایی که باید `noindex` باشند → فایلی که آن را اعلام می‌کند.
 *
 * این جدول «قراردادِ سیاست» است: هر ردیف می‌گوید این مسیر با متا (و نه با
 * Disallow) از ایندکس خارج می‌شود.
 */
const NOINDEX_ROUTES: Array<{ route: string; file: string }> = [
  { route: '/login', file: '(auth)/layout.tsx' },
  { route: '/login-with-pass', file: '(auth)/layout.tsx' },
  { route: '/sign-up', file: '(auth)/layout.tsx' },
  { route: '/forgot-pass', file: '(auth)/layout.tsx' },
  { route: '/dashboard', file: '(user)/layout.tsx' },
  { route: '/admin', file: '(admin)/layout.tsx' },
  { route: '/compare', file: '(public)/compare/page.tsx' },
  { route: '/checkout', file: '(public)/checkout/layout.tsx' },
];

/** آیا یک پیشوندِ robots این مسیر را پوشش می‌دهد؟ */
function covers(prefix: string, route: string): boolean {
  return route === prefix || route.startsWith(prefix);
}

function readRouteFile(file: string): string {
  return readFileSync(join(APP_DIR, file), 'utf8');
}

describe('robots.txt — structure', () => {
  it('declares a sitemap', () => {
    assert.match(robotsTxt, /^Sitemap:\s*https:\/\/zoppinico\.com\/sitemap\.xml$/m);
  });

  it('allows crawling of the site root', () => {
    assert.ok(allowedPrefixes().includes('/'));
  });

  it('keeps the render-critical Next.js assets allowed before the blanket block', () => {
    const lines = robotsTxt.split('\n').map(line => line.trim());

    const staticIndex = lines.findIndex(line => line === 'Allow: /_next/static/');
    const imageIndex = lines.findIndex(line => line === 'Allow: /_next/image');
    const blockIndex = lines.findIndex(line => line === 'Disallow: /_next/');

    assert.ok(staticIndex >= 0, 'Allow: /_next/static/ موجود نیست');
    assert.ok(imageIndex >= 0, 'Allow: /_next/image موجود نیست');
    assert.ok(blockIndex >= 0, 'Disallow: /_next/ موجود نیست');
    assert.ok(
      staticIndex < blockIndex && imageIndex < blockIndex,
      'اجازه‌های _next باید پیش از مسدودسازیِ کلی بیایند',
    );
  });

  it('only disallows non-HTML paths', () => {
    assert.deepEqual(disallowedPrefixes().sort(), ['/_next/', '/api/']);
  });
});

describe('robots.txt vs page metadata — no Disallow/noindex conflicts', () => {
  it('never disallows a route that declares noindex in code', () => {
    for (const { route, file } of NOINDEX_ROUTES) {
      const conflicts = disallowedPrefixes().filter(prefix => covers(prefix, route));

      assert.deepEqual(
        conflicts,
        [],
        `مسیر ${route} هم Disallow شده و هم noindex دارد (${file})`,
      );
    }
  });

  it('marks every noindex route with index:false in its source file', () => {
    for (const { route, file } of NOINDEX_ROUTES) {
      const source = readRouteFile(file);

      assert.match(
        source,
        /robots:\s*\{[\s\S]*?index:\s*false/,
        `فایل ${file} باید متادیتای noindex برای ${route} داشته باشد`,
      );
    }
  });

  it('keeps dashboard and admin non-indexable', () => {
    assert.match(readRouteFile('(user)/layout.tsx'), /index:\s*false/);
    assert.match(readRouteFile('(admin)/layout.tsx'), /index:\s*false/);
  });

  it('keeps authentication routes non-indexable', () => {
    assert.match(readRouteFile('(auth)/layout.tsx'), /index:\s*false/);
  });
});

describe('proxy.ts — auth enforcement is independent of robots', () => {
  it('still protects /admin, /dashboard and /checkout', () => {
    const proxySource = readFileSync(join(process.cwd(), 'proxy.ts'), 'utf8');

    assert.match(proxySource, /['"`]\/admin['"`]/);
    assert.match(proxySource, /['"`]\/dashboard['"`]/);
    assert.match(proxySource, /['"`]\/checkout['"`]/);
  });
});
