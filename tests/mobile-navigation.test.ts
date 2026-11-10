import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import { makeCategoryTree } from '../components/layout/public/category-navigation';
import { cn } from '../lib/utils';
import type { CategoriesResponse } from '../services/features/categories/types';

const category = (
  id: number,
  parentId: number | null,
  name: string,
): CategoriesResponse => ({
  id,
  parentId,
  name,
  slug: name,
  image: '',
  secondImages: [],
  description: '',
  createdAt: '',
  updatedAt: '',
  isInHeroSection: false,
  isInHome: false,
  orderInHome: 0,
  orderInHero: 0,
  isActive: true,
});

const source = (path: string) =>
  readFileSync(resolve(__dirname, '..', path), 'utf8');

test('mobile categories show one level at a time, including orphaned categories', () => {
  const tree = makeCategoryTree([
    category(3, 2, 'leaf'),
    category(4, 99, 'orphan'),
    category(1, null, 'parent'),
    category(2, 1, 'child'),
    category(5, 5, 'self-parent'),
  ]);

  assert.deepEqual(
    tree.map(node => node.name),
    ['orphan', 'parent', 'self-parent'],
  );
  assert.deepEqual(
    tree[1].children.map(node => node.name),
    ['child'],
  );
  assert.deepEqual(
    tree[1].children[0].children.map(node => node.name),
    ['leaf'],
  );
  assert.equal(tree[0].children.length, 0);
});

test('mobile category sheet stays bounded and lets users scroll, go back and close', () => {
  const sheet = source('components/layout/public/mobile-bottom-navigation.tsx');
  assert.match(sheet, /data-\[side=bottom\]:h-\[min\(72dvh,600px\)\]/);
  assert.equal(
    cn('data-[side=bottom]:h-auto', 'data-[side=bottom]:h-[min(72dvh,600px)]'),
    'data-[side=bottom]:h-[min(72dvh,600px)]',
  );
  assert.match(sheet, /min-h-0 flex-1 overflow-y-auto overscroll-contain/);
  assert.match(sheet, /onTouchEnd=\{finishHeaderSwipe\}/);
  assert.match(sheet, /<SheetClose asChild>/);
  assert.match(sheet, /aria-label="بازگشت به دسته‌بندی قبلی"/);
  assert.match(sheet, /onClick=\{\(\) => openCategory\(category\)\}/);
  assert.match(
    sheet,
    /scrollPositions\.current\.get\(currentCategory\?\.id \?\? 'root'\)/,
  );
  assert.match(
    sheet,
    /href=\{`\/product-category\/\$\{currentCategory.slug\}`\}/,
  );
  assert.match(sheet, /href=\{`\/category\/\$\{currentCategory.slug\}`\}/);
  assert.doesNotMatch(sheet, /function CategoryLinks/);
});

test('mobile header centers the logo with an empty right slot and search on the left', () => {
  const header = source('components/layout/public/header.tsx');

  // سه ستون 1fr auto 1fr: ستون وسط (لوگو) همیشه دقیقاً در مرکز می‌ماند،
  // حتی اگر عرض ستون‌های راست/چپ برابر نباشد.
  assert.match(
    header,
    /grid h-13 grid-cols-\[1fr_auto_1fr\] items-center px-3 lg:hidden/,
  );
  assert.match(header, /<span aria-hidden="true" \/>\s*<Logo[^>]*\/>\s*<div/);

  // در RTL ستون اول سمت راست است: باید خالی بماند (بدون لوگو/دکمه).
  const mobileHeader = header.slice(header.indexOf('grid-cols-[1fr_auto_1fr]'));
  const firstColumn = mobileHeader.slice(0, mobileHeader.indexOf('<Logo'));
  assert.doesNotMatch(firstColumn, /<Search|<Cart|<AuthButton/);

  // سرچ در ستون سوم (سمت چپ در RTL) است.
  assert.match(
    mobileHeader,
    /<div className="flex items-center justify-end">\s*<Search variant="mobile" \/>/,
  );
});

test('mobile search is an icon that opens the same focused search form as desktop', () => {
  const search = source('components/layout/public/search.tsx');
  const header = source('components/layout/public/header.tsx');
  assert.match(header, /lg:hidden/);
  assert.match(header, /<Search variant="mobile" \/>/);
  assert.match(search, /variant === 'mobile'\s*\? 'inline-flex size-11/);
  assert.match(
    search,
    /if \(!panelOpen\) return;\s*const timer = window.setTimeout\(\(\) => inputRef.current\?\.focus\(\), 30\)/,
  );
  assert.match(search, /<form\s+onSubmit=\{submitSearch\}\s+role="search"/);
  assert.doesNotMatch(search, /mobileControl/);
});
