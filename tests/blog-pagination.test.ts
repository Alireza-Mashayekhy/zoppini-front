import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  BLOG_CANONICAL_BASE,
  BLOG_PAGE_SIZE,
  BLOG_TITLE,
  blogPageTitle,
  buildBlogPageSeo,
  parsePageParam,
  persianPageNumber,
  resolveBlogRobots,
} from '@/lib/blog-pagination';

/**
 * تست‌های سیاستِ صفحه‌بندیِ وبلاگ.
 *
 * هدف: تثبیتِ این رفتارها
 * - صفحه‌ی ۱ (و `?page=1`) canonicalِ `/blog` با عنوانِ پایه؛
 * - صفحات ۲ به بعد canonicalِ خودگویا، عنوانِ اختصاصی و `index, follow`؛
 * - مقادیرِ نامعتبر (صفر، منفی، غیرعددی، خارج از محدوده) `noindex` می‌گیرند؛
 * - جستجو همیشه `noindex` می‌گیرد.
 */

describe('parsePageParam', () => {
  it('accepts positive integers as numbers and strings', () => {
    assert.equal(parsePageParam(2), 2);
    assert.equal(parsePageParam('2'), 2);
    assert.equal(parsePageParam('12'), 12);
  });

  it('rejects zero, negative and non-integer values', () => {
    assert.equal(parsePageParam(0), null);
    assert.equal(parsePageParam('0'), null);
    assert.equal(parsePageParam(-1), null);
    assert.equal(parsePageParam('-3'), null);
    assert.equal(parsePageParam(1.5), null);
    assert.equal(parsePageParam('1.5'), null);
  });

  it('rejects malformed values instead of silently falling back to page 1', () => {
    assert.equal(parsePageParam('abc'), null);
    assert.equal(parsePageParam(''), null);
    assert.equal(parsePageParam('  '), null);
    assert.equal(parsePageParam('2abc'), null);
    assert.equal(parsePageParam(undefined), null);
    assert.equal(parsePageParam(null), null);
    assert.equal(parsePageParam(NaN), null);
    assert.equal(parsePageParam(Infinity), null);
  });

  it('handles repeated query params by reading the first value', () => {
    assert.equal(parsePageParam(['2', '5']), 2);
    assert.equal(parsePageParam(['x', '5']), null);
  });

  it('ignores surrounding whitespace on valid numbers', () => {
    assert.equal(parsePageParam(' 3 '), 3);
  });
});

describe('blogPageTitle', () => {
  it('uses the base title for page 1', () => {
    assert.equal(blogPageTitle(1), BLOG_TITLE);
  });

  it('builds a unique title per page using Persian numerals', () => {
    assert.equal(blogPageTitle(2), 'وبلاگ - صفحه ۲ - زوپینی');
    assert.equal(blogPageTitle(15), 'وبلاگ - صفحه ۱۵ - زوپینی');
  });

  it('never repeats the base title on paginated pages', () => {
    const titles = new Set([blogPageTitle(1), blogPageTitle(2), blogPageTitle(3), blogPageTitle(4)]);

    assert.equal(titles.size, 4);
  });

  it('renders numbers with Persian digits', () => {
    assert.equal(persianPageNumber(12), '۱۲');
  });

  it('appends the page suffix to a custom base title from the SEO panel', () => {
    assert.equal(blogPageTitle(2, 'وبلاگ زوپینی'), 'وبلاگ زوپینی - صفحه ۲');
    assert.equal(blogPageTitle(1, 'وبلاگ زوپینی'), 'وبلاگ زوپینی');
  });
});

describe('resolveBlogRobots', () => {
  it('keeps the pagination policy when the panel has no directive', () => {
    assert.deepEqual(resolveBlogRobots(null, { index: true, follow: true }), {
      index: true,
      follow: true,
    });
    assert.deepEqual(resolveBlogRobots(undefined, { index: false, follow: true }), {
      index: false,
      follow: true,
    });
  });

  it('lets the panel turn indexing off', () => {
    assert.deepEqual(
      resolveBlogRobots({ indexable: false }, { index: true, follow: true }),
      { index: false, follow: true },
    );
    assert.deepEqual(
      resolveBlogRobots({ followable: false }, { index: true, follow: true }),
      { index: true, follow: false },
    );
  });

  it('never lets the panel re-enable an invalid page', () => {
    assert.deepEqual(
      resolveBlogRobots({ indexable: true }, { index: false, follow: true }),
      { index: false, follow: true },
    );
  });

  it('treats null panel flags as "no opinion"', () => {
    assert.deepEqual(
      resolveBlogRobots(
        { indexable: null, followable: null },
        { index: true, follow: true },
      ),
      { index: true, follow: true },
    );
  });
});

describe('buildBlogPageSeo — page 1', () => {
  it('maps the bare /blog URL to the base canonical and title', () => {
    const seo = buildBlogPageSeo({ totalPages: 3 });

    assert.equal(seo.requestedPage, 1);
    assert.equal(seo.isPaginated, false);
    assert.equal(seo.canonical, BLOG_CANONICAL_BASE);
    assert.equal(seo.title, BLOG_TITLE);
    assert.deepEqual(seo.robots, { index: true, follow: true });
  });

  it('treats ?page=1 exactly like /blog (no duplicate canonical)', () => {
    const seo = buildBlogPageSeo({ page: '1', totalPages: 3 });

    assert.equal(seo.canonical, BLOG_CANONICAL_BASE);
    assert.equal(seo.title, BLOG_TITLE);
    assert.equal(seo.isPaginated, false);
  });
});

describe('buildBlogPageSeo — paginated pages', () => {
  it('uses a self-referential canonical for page 2 and beyond', () => {
    const seo = buildBlogPageSeo({ page: '2', totalPages: 5 });

    assert.equal(seo.isPaginated, true);
    assert.equal(seo.canonical, `${BLOG_CANONICAL_BASE}?page=2`);
    assert.equal(seo.title, 'وبلاگ - صفحه ۲ - زوپینی');
    assert.deepEqual(seo.robots, { index: true, follow: true });
  });

  it('keeps every paginated page indexable (no rel=next/prev, no noindex)', () => {
    for (const page of [2, 3, 10]) {
      const seo = buildBlogPageSeo({ page: String(page), totalPages: 10 });

      assert.equal(seo.robots.index, true);
      assert.equal(seo.robots.follow, true);
      assert.equal(seo.canonical, `${BLOG_CANONICAL_BASE}?page=${page}`);
    }
  });

  it('produces a distinct canonical and title per page', () => {
    const pages = [1, 2, 3, 4].map(page =>
      buildBlogPageSeo({ page: String(page), totalPages: 4 }),
    );

    assert.equal(new Set(pages.map(page => page.canonical)).size, 4);
    assert.equal(new Set(pages.map(page => page.title)).size, 4);
  });
});

describe('buildBlogPageSeo — invalid or out-of-range pages', () => {
  it('noindexes zero and negative page values', () => {
    for (const page of ['0', '-1', -5, 'abc', 1.5]) {
      const seo = buildBlogPageSeo({ page, totalPages: 5 });

      assert.equal(seo.isValidPage, false, `page=${String(page)}`);
      assert.equal(seo.canonical, BLOG_CANONICAL_BASE);
      assert.deepEqual(seo.robots, { index: false, follow: true });
    }
  });

  it('noindexes pages beyond the known total', () => {
    const seo = buildBlogPageSeo({ page: '99', totalPages: 3 });

    assert.equal(seo.isValidPage, false);
    assert.equal(seo.canonical, BLOG_CANONICAL_BASE);
    assert.equal(seo.title, BLOG_TITLE);
    assert.deepEqual(seo.robots, { index: false, follow: true });
  });

  it('treats the last valid page as indexable', () => {
    const seo = buildBlogPageSeo({ page: '3', totalPages: 3 });

    assert.equal(seo.isValidPage, true);
    assert.deepEqual(seo.robots, { index: true, follow: true });
  });
});

describe('buildBlogPageSeo — search results', () => {
  it('noindexes internal search results and points to /blog', () => {
    const seo = buildBlogPageSeo({ search: 'کت', totalPages: 2 });

    assert.equal(seo.isSearch, true);
    assert.equal(seo.canonical, BLOG_CANONICAL_BASE);
    assert.deepEqual(seo.robots, { index: false, follow: true });
  });

  it('noindexes a paginated search result too', () => {
    const seo = buildBlogPageSeo({ page: '2', search: 'کت', totalPages: 4 });

    assert.equal(seo.isPaginated, false);
    assert.equal(seo.canonical, BLOG_CANONICAL_BASE);
    assert.deepEqual(seo.robots, { index: false, follow: true });
  });

  it('ignores whitespace-only search values', () => {
    const seo = buildBlogPageSeo({ search: '   ', totalPages: 3 });

    assert.equal(seo.isSearch, false);
    assert.deepEqual(seo.robots, { index: true, follow: true });
  });
});

describe('buildBlogPageSeo — robustness', () => {
  it('defaults to one page when totalPages is missing or invalid', () => {
    assert.equal(buildBlogPageSeo({ page: '2', totalPages: null }).isValidPage, false);
    assert.equal(buildBlogPageSeo({ page: '2', totalPages: undefined }).isValidPage, false);
    assert.equal(buildBlogPageSeo({ page: '2', totalPages: 0 }).isValidPage, false);
    assert.equal(buildBlogPageSeo({ page: '1' }).isValidPage, true);
  });

  it('handles a single-page blog without inventing pagination', () => {
    const seo = buildBlogPageSeo({ totalPages: 1 });

    assert.equal(seo.isPaginated, false);
    assert.equal(seo.canonical, BLOG_CANONICAL_BASE);
  });

  it('keeps the documented page size', () => {
    assert.equal(BLOG_PAGE_SIZE, 12);
  });
});
