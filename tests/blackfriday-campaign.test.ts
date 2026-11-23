import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BLACK_FRIDAY_CATEGORY_ID,
  BLACK_FRIDAY_DEADLINE_UTC_MS,
  BLACK_FRIDAY_MAX_SCAN_PAGES,
  BLACK_FRIDAY_PAGE_SIZE,
  blackFridayCategoryFilter,
  blackFridayCategoryHref,
  formatCountdownUnit,
  isBlackFridaySubcategoryId,
  remainingUntilDeadline,
  resolveBlackFridaySubcategories,
} from '../lib/blackfriday/campaign';
import type { CategoriesResponse } from '../services/features/categories/types';

test('campaign deadline is Sunday 8 Azar 1405, 23:59:59 in Tehran', () => {
  // لحظهٔ مطلق مستقل از منطقهٔ زمانی سرور/مرورگر
  assert.equal(
    new Date(BLACK_FRIDAY_DEADLINE_UTC_MS).toISOString(),
    '2026-11-29T20:29:59.000Z',
  );

  const parts = new Intl.DateTimeFormat('en-u-ca-persian', {
    timeZone: 'Asia/Tehran',
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(BLACK_FRIDAY_DEADLINE_UTC_MS));
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

  assert.deepEqual(
    [
      values.weekday,
      values.year,
      values.month,
      values.day,
      values.hour,
      values.minute,
      values.second,
    ],
    ['Sunday', '1405', '9', '8', '23', '59', '59'],
  );
});

test('countdown parts are computed from the absolute deadline', () => {
  const beforeMinute = remainingUntilDeadline(
    Date.parse('2026-11-29T20:29:00Z'),
  );
  assert.deepEqual(beforeMinute, {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 59,
    expired: false,
  });

  const weekBefore = remainingUntilDeadline(
    Date.parse('2026-11-22T20:29:59Z'),
  );
  assert.equal(weekBefore.days, 7);
  assert.equal(weekBefore.expired, false);

  // در کسرِ آخرِ ثانیه نباید همهٔ رقم‌ها صفر شوند
  const almost = remainingUntilDeadline(BLACK_FRIDAY_DEADLINE_UTC_MS - 200);
  assert.equal(almost.seconds, 1);
  assert.equal(almost.expired, false);
});

test('countdown reports the expired state at and after the deadline', () => {
  for (const now of [
    BLACK_FRIDAY_DEADLINE_UTC_MS,
    BLACK_FRIDAY_DEADLINE_UTC_MS + 60_000,
  ]) {
    assert.deepEqual(remainingUntilDeadline(now), {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    });
  }
});

test('countdown units are two digits in Persian numerals', () => {
  assert.equal(formatCountdownUnit(0), '۰۰');
  assert.equal(formatCountdownUnit(7), '۰۷');
  assert.equal(formatCountdownUnit(59), '۵۹');
  assert.equal(formatCountdownUnit(123), '۱۲۳');
});

test('campaign reads the real category with the real page size', () => {
  assert.equal(BLACK_FRIDAY_CATEGORY_ID, 137);
  assert.equal(BLACK_FRIDAY_PAGE_SIZE, 24);
  assert.ok(BLACK_FRIDAY_MAX_SCAN_PAGES >= 2);
});

test('five real subcategories keep their production slugs', () => {
  const subcategories = resolveBlackFridaySubcategories(undefined);

  assert.deepEqual(
    subcategories.map(item => item.id),
    [138, 139, 140, 141, 142],
  );
  assert.deepEqual(
    subcategories.map(item => item.slug),
    [
      'mens-classic-shirts',
      'mens-casual-shirts',
      'mens-trousers',
      'mens-blazers',
      'mens--coats',
    ],
  );
  assert.ok(subcategories.every(item => item.image.startsWith('/campaign/')));
  assert.ok(subcategories.every(item => isBlackFridaySubcategoryId(item.id)));
  assert.equal(isBlackFridaySubcategoryId(137), false);

  assert.equal(
    blackFridayCategoryHref('mens-classic-shirts'),
    '/product-category/mens-classic-shirts',
  );
});

test('live category names and slugs override the campaign fallbacks', () => {
  const live = [
    {
      id: 141,
      name: 'کت تک جدید',
      slug: 'mens-blazers-new',
      image: '',
      secondImages: [],
      description: '',
      createdAt: '',
      updatedAt: '',
      parentId: 137,
      isInHeroSection: false,
      isInHome: false,
      orderInHome: 0,
      orderInHero: 0,
      isActive: true,
    },
  ] as CategoriesResponse[];

  const subcategories = resolveBlackFridaySubcategories(live);
  const blazer = subcategories.find(item => item.id === 141);

  assert.equal(blazer?.name, 'کت تک جدید');
  assert.equal(blazer?.slug, 'mens-blazers-new');
  // کاشی‌های دیگر دست‌نخورده می‌مانند
  assert.equal(subcategories.find(item => item.id === 140)?.name, 'شلوار');
});

test('category filter keeps the campaign scope without breaking subcategory filtering', () => {
  assert.deepEqual(blackFridayCategoryFilter(), [137]);
  assert.deepEqual(blackFridayCategoryFilter(null), [137]);

  // زیردسته تنها با شناسهٔ خودش فرستاده می‌شود؛ ۱۳۷ کنارش باعث می‌شود
  // بک‌اند دامنه را به کل کمپین باز کند و فیلتر بی‌اثر شود.
  for (const id of [138, 139, 140, 141, 142]) {
    assert.deepEqual(blackFridayCategoryFilter(id), [id]);
  }

  // شناسهٔ بیرون از کمپین هرگز فیلتر نمی‌شود
  assert.deepEqual(blackFridayCategoryFilter(999), [137]);
});
