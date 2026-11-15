import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  applyRobotsDirective,
  mergePageSeo,
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_TITLE,
} from '@/lib/seo';

/**
 * تست‌های اولویتِ متادیتا (`mergePageSeo`).
 *
 * مسئله‌ی اصلی: رکوردِ پنل سئو برای `/digital-catalog` متنِ صفحه‌ی اصلی را
 * دارد؛ چون مقدارِ پنل همیشه بر متادیتای خودِ صفحه غلبه می‌کرد، این صفحه
 * عنوانِ صفحه‌ی اصلی را منتشر می‌کرد. حالا مقداری که دقیقاً برابرِ
 * پیش‌فرضِ سایت است «وارد نشده» تلقی می‌شود و متادیتای اختصاصیِ صفحه حفظ
 * می‌شود. این تست‌ها آن رفتار را تثبیت می‌کنند.
 */

const digitalCatalogFallback = {
  title: 'کاتالوگ دیجیتال زوپینی',
  description: 'کاتالوگ دیجیتال زوپینی را ورق بزنید.',
  alternates: { canonical: 'https://zoppinico.com/digital-catalog' },
};

describe('mergePageSeo — panel values that repeat the site default', () => {
  it('keeps the page-specific title when the panel stored the homepage title', () => {
    const merged = mergePageSeo(digitalCatalogFallback, {
      metaTitle: SITE_DEFAULT_TITLE,
      metaDescription: SITE_DEFAULT_DESCRIPTION,
    });

    assert.equal(merged.title, 'کاتالوگ دیجیتال زوپینی');
    assert.equal(merged.description, 'کاتالوگ دیجیتال زوپینی را ورق بزنید.');
    assert.deepEqual(merged.alternates, {
      canonical: 'https://zoppinico.com/digital-catalog',
    });
  });

  it('ignores whitespace-only differences from the site default', () => {
    const merged = mergePageSeo(digitalCatalogFallback, {
      metaTitle: `  ${SITE_DEFAULT_TITLE}  `,
    });

    assert.equal(merged.title, 'کاتالوگ دیجیتال زوپینی');
  });

  it('is a no-op for the homepage, whose fallback equals the site default', () => {
    const homeFallback = {
      title: SITE_DEFAULT_TITLE,
      description: SITE_DEFAULT_DESCRIPTION,
      alternates: { canonical: 'https://zoppinico.com' },
    };

    const merged = mergePageSeo(homeFallback, {
      metaTitle: SITE_DEFAULT_TITLE,
      metaDescription: SITE_DEFAULT_DESCRIPTION,
    });

    assert.equal(merged.title, SITE_DEFAULT_TITLE);
    assert.equal(merged.description, SITE_DEFAULT_DESCRIPTION);
  });
});

describe('mergePageSeo — real panel values still win', () => {
  it('overrides the fallback title and description', () => {
    const merged = mergePageSeo(digitalCatalogFallback, {
      metaTitle: 'کاتالوگ دیجیتال — مجموعه پاییز زوپینی',
      metaDescription: 'نسخه‌ی دیجیتال کاتالوگ پاییزه‌ی زوپینی را اینجا ببینید.',
    });

    assert.equal(merged.title, 'کاتالوگ دیجیتال — مجموعه پاییز زوپینی');
    assert.equal(merged.description, 'نسخه‌ی دیجیتال کاتالوگ پاییزه‌ی زوپینی را اینجا ببینید.');
  });

  it('overrides only the title when only the title is provided', () => {
    const merged = mergePageSeo(digitalCatalogFallback, {
      metaTitle: 'عنوان اختصاصی',
    });

    assert.equal(merged.title, 'عنوان اختصاصی');
    assert.equal(merged.description, 'کاتالوگ دیجیتال زوپینی را ورق بزنید.');
  });

  it('returns the fallback untouched when no panel record exists', () => {
    const merged = mergePageSeo(digitalCatalogFallback, null);

    assert.equal(merged.title, 'کاتالوگ دیجیتال زوپینی');
    assert.equal(merged.alternates, digitalCatalogFallback.alternates);
  });

  it('keeps empty panel values empty-handed', () => {
    const merged = mergePageSeo(digitalCatalogFallback, {
      metaTitle: '   ',
      metaDescription: '',
    });

    assert.equal(merged.title, 'کاتالوگ دیجیتال زوپینی');
    assert.equal(merged.description, 'کاتالوگ دیجیتال زوپینی را ورق بزنید.');
  });
});

describe('mergePageSeo — robots directives are independent of titles', () => {
  it('still applies noindex from the panel even when the title is ignored', () => {
    const merged = mergePageSeo(digitalCatalogFallback, {
      metaTitle: SITE_DEFAULT_TITLE,
      indexable: false,
    });

    assert.equal(merged.title, 'کاتالوگ دیجیتال زوپینی');
    assert.deepEqual(merged.robots, { index: false, follow: true });
  });

  it('applies nofollow when the panel asks for it', () => {
    const merged = mergePageSeo(digitalCatalogFallback, {
      followable: false,
    });

    assert.deepEqual(merged.robots, { index: true, follow: false });
  });

  it('leaves robots untouched when both flags are default', () => {
    const merged = mergePageSeo(digitalCatalogFallback, {
      indexable: true,
      followable: true,
    });

    assert.equal(merged.robots, undefined);
  });

  it('applyRobotsDirective ignores a missing record', () => {
    assert.deepEqual(applyRobotsDirective({ title: 'x' }, null), { title: 'x' });
  });
});

describe('site defaults — single source of truth', () => {
  it('matches the root layout metadata', () => {
    const layout = readFileSync(join(process.cwd(), 'app/layout.tsx'), 'utf8');

    assert.match(
      layout,
      /title:\s*SITE_DEFAULT_TITLE/,
      'لِی‌اوت باید از ثابتِ SITE_DEFAULT_TITLE استفاده کند',
    );
    assert.match(
      layout,
      /description:\s*SITE_DEFAULT_DESCRIPTION/,
      'لِی‌اوت باید از ثابتِ SITE_DEFAULT_DESCRIPTION استفاده کند',
    );
  });

  it('matches the homepage fallback', () => {
    const home = readFileSync(join(process.cwd(), 'app/(public)/page.tsx'), 'utf8');

    assert.match(home, /title:\s*SITE_DEFAULT_TITLE/);
    assert.match(home, /description:\s*SITE_DEFAULT_DESCRIPTION/);
  });
});
