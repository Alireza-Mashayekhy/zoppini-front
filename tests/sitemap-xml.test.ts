import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  escapeXml,
  formatSitemapLastmod,
  renderSitemapIndex,
  renderSitemapUrlset,
  SITE_URL,
  toSitemapLoc,
} from '../lib/sitemap-xml';

test('escapeXml escapes all five XML special characters', () => {
  assert.equal(
    escapeXml(`& < > " '`),
    '&amp; &lt; &gt; &quot; &apos;',
  );
});

test('escapeXml replaces & before the other entities', () => {
  // اگر `&` اول جایگزین نشود، `&lt;` به `&amp;lt;` تبدیل می‌شود.
  assert.equal(escapeXml('a & < b'), 'a &amp; &lt; b');
});

test('toSitemapLoc turns a path into an absolute canonical URL', () => {
  assert.equal(
    toSitemapLoc('/blog/suit-care'),
    'https://zoppinico.com/blog/suit-care',
  );
});

test('toSitemapLoc encodes spaces without rewriting the slug itself', () => {
  // اسلاگ واقعی و قدیمیِ سایت که فاصله دارد.
  assert.equal(
    toSitemapLoc('/blog/how to match socks'),
    'https://zoppinico.com/blog/how%20to%20match%20socks',
  );
});

test('toSitemapLoc keeps already percent-encoded slugs untouched', () => {
  const persianSlug = '/product/%d9%be%db%8c%d8%b1%d8%a7%d9%87%d9%86-630';

  assert.equal(toSitemapLoc(persianSlug), `${SITE_URL}${persianSlug}`);
});

test('toSitemapLoc keeps an absolute canonical URL as is', () => {
  assert.equal(
    toSitemapLoc('https://zoppinico.com/blog/suit-care'),
    'https://zoppinico.com/blog/suit-care',
  );
});

test('toSitemapLoc drops fragments', () => {
  assert.equal(
    toSitemapLoc('/blog/suit-care#section-2'),
    'https://zoppinico.com/blog/suit-care',
  );
});

test('formatSitemapLastmod accepts Date, ISO string and timestamp', () => {
  const iso = '2026-06-30T08:01:32.000Z';

  assert.equal(formatSitemapLastmod(new Date(iso)), iso);
  assert.equal(formatSitemapLastmod(iso), iso);
  assert.equal(formatSitemapLastmod(new Date(iso).getTime()), iso);
});

test('formatSitemapLastmod returns null for missing or invalid values', () => {
  assert.equal(formatSitemapLastmod(null), null);
  assert.equal(formatSitemapLastmod(undefined), null);
  assert.equal(formatSitemapLastmod(''), null);
  assert.equal(formatSitemapLastmod('not-a-date'), null);
  assert.equal(formatSitemapLastmod(new Date('invalid')), null);
});

test('renderSitemapUrlset emits a valid urlset with escaped locations', () => {
  const xml = renderSitemapUrlset([
    {
      loc: toSitemapLoc('/blog/how to match socks'),
      lastModified: '2026-06-30T08:01:32.000Z',
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    { loc: toSitemapLoc('/products') },
  ]);

  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(
    xml,
    /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/,
  );
  assert.ok(xml.includes('<loc>https://zoppinico.com/blog/how%20to%20match%20socks</loc>'));
  assert.ok(!/how to match/.test(xml));
  assert.ok(xml.includes('<lastmod>2026-06-30T08:01:32.000Z</lastmod>'));
  assert.ok(xml.includes('<changefreq>weekly</changefreq>'));
  assert.ok(xml.includes('<priority>0.7</priority>'));
  assert.ok(xml.trimEnd().endsWith('</urlset>'));
  assert.equal((xml.match(/<url>/g) ?? []).length, 2);
});

test('renderSitemapUrlset omits lastmod entirely when the date is invalid', () => {
  const xml = renderSitemapUrlset([{ loc: `${SITE_URL}/blog/suit-care`, lastModified: null }]);

  assert.ok(!xml.includes('<lastmod>'));
});

test('renderSitemapUrlset never emits a fabricated request time', () => {
  const xml = renderSitemapUrlset([{ loc: `${SITE_URL}/products` }]);

  const today = new Date().toISOString().slice(0, 10);

  assert.ok(!xml.includes(today));
});

test('renderSitemapUrlset escapes ampersands coming from real slugs', () => {
  const xml = renderSitemapUrlset([{ loc: toSitemapLoc('/product/shirt & trousers') }]);

  assert.ok(xml.includes('<loc>https://zoppinico.com/product/shirt%20&amp;%20trousers</loc>'));
  assert.ok(!/ & /.test(xml));
});

test('renderSitemapIndex uses sitemapindex/sitemap elements, not urlset/url', () => {
  const xml = renderSitemapIndex([
    { loc: `${SITE_URL}/page-sitemap.xml` },
    { loc: `${SITE_URL}/post-sitemap.xml` },
  ]);

  assert.match(xml, /<sitemapindex xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.ok(!xml.includes('<urlset'));
  assert.ok(!xml.includes('<url>'));
  assert.equal((xml.match(/<sitemap>/g) ?? []).length, 2);
  assert.ok(xml.includes('<loc>https://zoppinico.com/page-sitemap.xml</loc>'));
  assert.ok(xml.trimEnd().endsWith('</sitemapindex>'));
});

test('renderSitemapIndex handles an empty child list without breaking XML', () => {
  const xml = renderSitemapIndex([]);

  assert.match(xml, /<sitemapindex[^>]*>\s*<\/sitemapindex>/);
});
