import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  deriveBlackFridayFilterOptions,
  EMPTY_BLACK_FRIDAY_FILTERS,
  filterBlackFridayProducts,
  hasActiveBlackFridayFilters,
  productMatchesSearch,
  sortBlackFridayProducts,
} from '../lib/blackfriday/filtering';
import {
  buildCategoryIndex,
  interleaveBalancedProducts,
  isTwentyPercentProduct,
  productDiscountPercent,
  productPrimaryRootId,
} from '../lib/blackfriday/products';
import type { CategoriesResponse } from '../services/features/categories/types';
import {
  DiscountType,
  type ProductDiscount,
} from '../services/features/discounts/types';
import type {
  ProductsResponse,
  VariantResponse,
} from '../services/features/products/type';

/** هشت دستهٔ اصلی فروشگاه + زیردسته‌هایشان (شناسه‌های واقعی در دیتابیس) */
function makeCategories(): CategoriesResponse[] {
  const mains = [
    { id: 1, name: 'پیراهن مردانه' },
    { id: 2, name: 'کت و شلوار و شلوار' },
    { id: 3, name: 'شلوار مردانه' },
    { id: 4, name: 'اکسسوری مردانه' },
    { id: 5, name: 'چرم مردانه' },
    { id: 6, name: 'پاییزه و زمستانه' },
    { id: 7, name: 'رویه و بافت' },
    { id: 8, name: 'کفش' },
  ];

  const categories: CategoriesResponse[] = mains.map(main => ({
    id: main.id,
    name: main.name,
    slug: `main-${main.id}`,
    image: '',
    secondImages: [],
    description: '',
    createdAt: '',
    updatedAt: '',
    parentId: null,
    isInHeroSection: false,
    isInHome: false,
    orderInHome: 0,
    orderInHero: 0,
    isActive: true,
  }));

  // برای هر دستهٔ اصلی دو زیردسته
  for (const main of mains) {
    for (let index = 0; index < 2; index += 1) {
      const id = main.id * 10 + index + 1;
      categories.push({
        id,
        name: `${main.name} ${index + 1}`,
        slug: `sub-${id}`,
        image: '',
        secondImages: [],
        description: '',
        createdAt: '',
        updatedAt: '',
        parentId: main.id,
        isInHeroSection: false,
        isInHome: false,
        orderInHome: 0,
        orderInHero: 0,
        isActive: true,
      });
    }
  }

  // دستهٔ بلک فرایدی و زیردسته‌هایش
  categories.push({
    id: 137,
    name: 'زوپینی بلک فرایدی',
    slug: 'zoppini-black-friday',
    image: '',
    secondImages: [],
    description: '',
    createdAt: '',
    updatedAt: '',
    parentId: null,
    isInHeroSection: false,
    isInHome: false,
    orderInHome: 0,
    orderInHero: 0,
    isActive: true,
  });
  for (let index = 0; index < 3; index += 1) {
    const id = 138 + index;
    categories.push({
      id,
      name: `بلک فرایدی ${index + 1}`,
      slug: `bf-${id}`,
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
    });
  }

  return categories;
}

type Draft = {
  id: number;
  percent?: number;
  price?: number;
  title?: string;
  createdAt?: string;
  /** شناسه‌های دسته‌های مستقیم محصول */
  categoryIds?: number[];
  sizeId?: number;
  colorId?: number;
  stock?: number;
};

function makeProduct(draft: Draft, categories: CategoriesResponse[]): ProductsResponse {
  const price = draft.price ?? 1_000_000;
  const percent = draft.percent ?? 0;
  const finalPrice = Math.round(price * (1 - percent / 100));

  const discount: ProductDiscount | undefined =
    percent > 0
      ? {
          id: percent,
          code: null,
          title: null,
          type: DiscountType.PERCENTAGE,
          value: percent,
          maxDiscountAmount: null,
          discountAmount: price - finalPrice,
          originalPrice: price,
          finalPrice,
          expiresAt: '2026-11-30T20:30:00.000Z',
          stages: [],
          stacked: false,
        }
      : undefined;

  const byId = new Map(categories.map(category => [category.id, category]));
  const productCategories = (draft.categoryIds ?? [])
    .map(id => byId.get(id))
    .filter((category): category is CategoriesResponse => Boolean(category));

  return {
    id: draft.id,
    productCode: `P-${draft.id}`,
    title: draft.title ?? `محصول ${draft.id}`,
    slug: `product-${draft.id}`,
    image: `images/${draft.id}.webp`,
    description: '',
    careInstructionsHtml: '',
    createdAt: draft.createdAt ?? '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    suggestedProducts: [],
    categories: productCategories,
    variants: [
      {
        id: draft.id,
        price,
        stock: draft.stock ?? 3,
        colorId: draft.colorId ?? 1,
        sizeId: draft.sizeId ?? 1,
        color: { id: draft.colorId ?? 1, name: 'مشکی', hexCode: '#000000' },
        size: { id: draft.sizeId ?? 1, name: 'M' },
      } as VariantResponse,
    ],
    comments: [],
    colorImages: [],
    sameColorProducts: [],
    ...(discount ? { discount } : {}),
  } as ProductsResponse;
}

test('only an active 20% discount qualifies for the 20% group', () => {
  const categories = makeCategories();

  assert.equal(
    isTwentyPercentProduct(makeProduct({ id: 1, percent: 20 }, categories)),
    true,
  );
  assert.equal(
    isTwentyPercentProduct(makeProduct({ id: 2, percent: 70 }, categories)),
    false,
  );
  assert.equal(
    isTwentyPercentProduct(makeProduct({ id: 3, percent: 30 }, categories)),
    false,
  );
  assert.equal(
    isTwentyPercentProduct(makeProduct({ id: 4, percent: 0 }, categories)),
    false,
  );
});

test('first two desktop rows mix 70% and 20% products (2 + 2 per row)', () => {
  const categories = makeCategories();
  const index = buildCategoryIndex(categories);

  const bf = Array.from({ length: 8 }, (_, i) =>
    makeProduct(
      { id: 100 + i, percent: 70, categoryIds: [138 + (i % 3)] },
      categories,
    ),
  );
  const twenty = Array.from({ length: 8 }, (_, i) =>
    makeProduct(
      {
        id: 200 + i,
        percent: 20,
        categoryIds: [(i % 8) * 10 + 1],
      },
      categories,
    ),
  );

  const bfIds = new Set(bf.map(product => product.id));
  const mixed = interleaveBalancedProducts([...bf, ...twenty], bfIds, index);

  assert.equal(mixed.length, 16);
  assert.equal(new Set(mixed.map(product => product.id)).size, 16);

  // ردیف اول (۴ محصول) و ردیف دوم: هر کدام دو ۷۰٪ و دو ۲۰٪
  for (const row of [mixed.slice(0, 4), mixed.slice(4, 8)]) {
    assert.equal(row.filter(product => bfIds.has(product.id)).length, 2);
    assert.equal(row.filter(product => !bfIds.has(product.id)).length, 2);
  }

  // تنوع دسته در دو ردیف اول: محصولات ۲۰٪ از دسته‌های اصلی متفاوت‌اند و
  // محصولات بلک فرایدی از زیردسته‌های متفاوت (همهٔ آن‌ها ریشهٔ ۱۳۷ دارند)
  const firstEight = mixed.slice(0, 8);
  const twentyRoots = firstEight
    .filter(product => !bfIds.has(product.id))
    .map(product => productPrimaryRootId(product, index));
  assert.equal(new Set(twentyRoots).size, twentyRoots.length);

  const bfDirect = firstEight
    .filter(product => bfIds.has(product.id))
    .map(product => product.categories[0]?.id);
  // فقط سه زیردستهٔ بلک فرایدی در این فیکسچر هست؛ هیچ دو محصولِ متوالیِ
  // هم‌گروه از یک زیردسته نیستند
  for (let i = 1; i < bfDirect.length; i += 1) {
    assert.notEqual(bfDirect[i], bfDirect[i - 1]);
  }
  assert.equal(new Set(bfDirect).size, 3);
});

test('interleaving fills with the other group when one group runs out', () => {
  const categories = makeCategories();
  const index = buildCategoryIndex(categories);

  const bf = [makeProduct({ id: 1, percent: 70, categoryIds: [138] }, categories)];
  const twenty = Array.from({ length: 5 }, (_, i) =>
    makeProduct({ id: 10 + i, percent: 20, categoryIds: [11] }, categories),
  );

  const mixed = interleaveBalancedProducts(
    [...bf, ...twenty],
    new Set([1]),
    index,
  );

  assert.equal(mixed.length, 6);
  assert.equal(mixed[0].id, 1);
  assert.deepEqual(
    mixed.slice(1).map(product => product.id),
    [10, 11, 12, 13, 14],
  );
});

test('search matches Persian product names and normalises Arabic letters', () => {
  const categories = makeCategories();
  const shirt = makeProduct(
    { id: 1, percent: 20, title: 'پیراهن کلاسیک مردانه' },
    categories,
  );
  const trousers = makeProduct(
    { id: 2, percent: 20, title: 'شلوار پارچه‌ای' },
    categories,
  );

  assert.equal(productMatchesSearch(shirt, 'پیرا'), true);
  assert.equal(productMatchesSearch(trousers, 'پیرا'), false);
  // ي/ك عربی باید مثل ی/ک فارسی پیدا شود
  assert.equal(productMatchesSearch(shirt, 'پيراهن'), true);
  assert.equal(productMatchesSearch(shirt, ''), true);
  assert.equal(productMatchesSearch(shirt, '   '), true);
});

test('category, size, color and price filters combine on final price', () => {
  const categories = makeCategories();
  const index = buildCategoryIndex(categories);

  const products = [
    makeProduct(
      {
        id: 1,
        percent: 20,
        price: 1_000_000,
        categoryIds: [11],
        sizeId: 1,
        colorId: 1,
      },
      categories,
    ),
    makeProduct(
      {
        id: 2,
        percent: 20,
        price: 2_000_000,
        categoryIds: [21],
        sizeId: 2,
        colorId: 2,
      },
      categories,
    ),
    makeProduct(
      {
        id: 3,
        percent: 70,
        price: 3_000_000,
        categoryIds: [138],
        sizeId: 1,
        colorId: 1,
      },
      categories,
    ),
  ];

  // فیلتر دستهٔ اصلی ۱: فقط محصول ۱ (زیردستهٔ ۱۱ زیر دستهٔ ۱ است)
  assert.deepEqual(
    filterBlackFridayProducts(
      products,
      { ...EMPTY_BLACK_FRIDAY_FILTERS, mainCategoryId: 1 },
      index,
    ).map(product => product.id),
    [1],
  );

  // فیلتر زیردستهٔ ۲۱
  assert.deepEqual(
    filterBlackFridayProducts(
      products,
      { ...EMPTY_BLACK_FRIDAY_FILTERS, subcategoryId: 21 },
      index,
    ).map(product => product.id),
    [2],
  );

  // ترکیب سایز + رنگ + قیمت نهایی (محصول ۲ قیمت نهایی ۱٬۶۰۰٬۰۰۰ دارد)
  assert.deepEqual(
    filterBlackFridayProducts(
      products,
      {
        ...EMPTY_BLACK_FRIDAY_FILTERS,
        sizeIds: [2],
        colorIds: [2],
        priceMin: 1_500_000,
        priceMax: 1_700_000,
      },
      index,
    ).map(product => product.id),
    [2],
  );

  // قیمت روی قیمت نهایی (پس از تخفیف) است، نه قیمت خط‌خورده
  assert.deepEqual(
    filterBlackFridayProducts(
      products,
      {
        ...EMPTY_BLACK_FRIDAY_FILTERS,
        priceMin: 2_500_000,
        priceMax: 3_000_000,
      },
      index,
    ).map(product => product.id),
    [],
  );
});

test('sorting keeps the balanced order by default and sorts the rest', () => {
  const categories = makeCategories();
  const products = [
    makeProduct(
      { id: 1, percent: 20, price: 2_000_000, createdAt: '2026-11-02T00:00:00.000Z' },
      categories,
    ),
    makeProduct(
      { id: 2, percent: 70, price: 1_000_000, createdAt: '2026-11-01T00:00:00.000Z' },
      categories,
    ),
  ];

  assert.deepEqual(
    sortBlackFridayProducts(products, 'balanced').map(product => product.id),
    [1, 2],
  );
  assert.deepEqual(
    sortBlackFridayProducts(products, 'discount:desc').map(product => product.id),
    [2, 1],
  );
  assert.deepEqual(
    sortBlackFridayProducts(products, 'price:asc').map(product => product.id),
    [2, 1],
  );
  assert.deepEqual(
    sortBlackFridayProducts(products, 'price:desc').map(product => product.id),
    [1, 2],
  );
  assert.deepEqual(
    sortBlackFridayProducts(products, 'createdAt:desc').map(product => product.id),
    [1, 2],
  );
});

test('filter options come from eligible products and their variants', () => {
  const categories = makeCategories();
  const index = buildCategoryIndex(categories);

  const products = [
    makeProduct(
      {
        id: 1,
        percent: 20,
        price: 1_000_000,
        categoryIds: [11],
        sizeId: 1,
        colorId: 1,
      },
      categories,
    ),
    makeProduct(
      {
        id: 2,
        percent: 70,
        price: 2_000_000,
        categoryIds: [138],
        sizeId: 2,
        colorId: 2,
      },
      categories,
    ),
  ];

  const options = deriveBlackFridayFilterOptions(products, index);

  // دسته‌های اصلی فقط آن‌هایی که محصول واجد دارند (۱ و ۱۳۷)
  assert.deepEqual(
    options.mainCategories.map(main => main.id),
    [1, 137],
  );
  assert.deepEqual(
    options.subcategoriesByMain.get(1)?.map(sub => sub.id),
    [11],
  );
  assert.deepEqual(
    options.subcategoriesByMain.get(137)?.map(sub => sub.id),
    [138],
  );
  assert.deepEqual(
    options.sizes.map(size => size.id),
    [1, 2],
  );
  assert.deepEqual(
    options.colors.map(color => color.id),
    [1, 2],
  );
  // بازهٔ قیمت از قیمت نهایی: ۸۰۰٬۰۰۰ و ۶۰۰٬۰۰۰
  assert.equal(options.minPrice, 600_000);
  assert.equal(options.maxPrice, 800_000);
});

test('active-filter detection drives the clear-all control', () => {
  assert.equal(hasActiveBlackFridayFilters(EMPTY_BLACK_FRIDAY_FILTERS), false);
  assert.equal(
    hasActiveBlackFridayFilters({ ...EMPTY_BLACK_FRIDAY_FILTERS, search: 'پیرا' }),
    true,
  );
  assert.equal(
    hasActiveBlackFridayFilters({
      ...EMPTY_BLACK_FRIDAY_FILTERS,
      priceMin: 100,
    }),
    true,
  );
  assert.equal(productDiscountPercent(makeProduct({ id: 9, percent: 20 }, makeCategories())), 20);
});
