import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  EMPTY_PROMOTION_FORM,
  normalizeRewardType,
  toPromotionDto,
} from '../components/admin/promotion/form-types';
import {
  PromotionRewardType,
  PromotionScope,
  PromotionType,
} from '../services/features/promotions/types';

/**
 * فرم سازندهٔ پروموشن: قرارداد بین فرم (مقادیر رشته‌ای/جلالی) و DTO سرور.
 * اشتباه در این لایه باعث می‌شود مدیر پروموشن ذخیره‌شده‌ای ببیند که قاعده‌اش
 * چیز دیگری است.
 */

const helpers = {
  persianToIso: (date: string, time: string) =>
    date ? `ISO(${date}@${time})` : '',
};

test('optional numeric fields left empty are omitted, not sent as NaN/null', () => {
  const dto = toPromotionDto(
    {
      ...EMPTY_PROMOTION_FORM,
      name: 'کمپین تست',
      startsAt: '1404/01/01',
      expiresAt: '1404/02/01',
    },
    helpers,
  );

  assert.equal(dto.maxDiscountAmount, null);
  assert.equal(dto.maxTotalUses, null);
  assert.equal(dto.maxUsesPerCustomer, null);
  assert.equal(dto.minQuantity, 0);
  assert.equal(dto.minCartValue, 0);
  assert.equal(Number.isNaN(Number(dto.rewardValue)), false);
});

test('a non-finite reward value is dropped instead of poisoning the config', () => {
  const dto = toPromotionDto(
    {
      ...EMPTY_PROMOTION_FORM,
      name: 'کمپین تست',
      rewardValue: Number.NaN as unknown as number,
      startsAt: '1404/01/01',
      expiresAt: '1404/02/01',
    },
    helpers,
  );

  assert.equal(dto.rewardValue, null);
});

test('persian dates are converted with their times, not to a fixed hour', () => {
  const dto = toPromotionDto(
    {
      ...EMPTY_PROMOTION_FORM,
      name: 'کمپین تست',
      startsAt: '1404/03/01',
      startsAtTime: '09:30',
      expiresAt: '1404/03/10',
      expiresAtTime: '23:59',
    },
    helpers,
  );

  assert.equal(dto.startsAt, 'ISO(1404/03/01@09:30)');
  assert.equal(dto.expiresAt, 'ISO(1404/03/10@23:59)');
});

test('scope ids are forwarded untouched so relations stay in sync', () => {
  const dto = toPromotionDto(
    {
      ...EMPTY_PROMOTION_FORM,
      name: 'کمپین تست',
      scope: PromotionScope.CATEGORIES_AND_PRODUCTS,
      productIds: [1, 2, 3],
      categoryIds: [9],
      excludedProductIds: [4],
      excludedCategoryIds: [8],
      startsAt: '1404/01/01',
      expiresAt: '1404/02/01',
    },
    helpers,
  );

  assert.deepEqual(dto.productIds, [1, 2, 3]);
  assert.deepEqual(dto.categoryIds, [9]);
  assert.deepEqual(dto.excludedProductIds, [4]);
  assert.deepEqual(dto.excludedCategoryIds, [8]);
});

test('stacking implies stackable so the engine honours a single switch', () => {
  const dto = toPromotionDto(
    {
      ...EMPTY_PROMOTION_FORM,
      name: 'کمپین تست',
      canStack: true,
      stackable: false,
      startsAt: '1404/01/01',
      expiresAt: '1404/02/01',
    },
    helpers,
  );

  assert.equal(dto.canStack, true);
  assert.equal(dto.stackable, true);
});

test('badge and popup copy is trimmed and empty copy becomes null', () => {
  const dto = toPromotionDto(
    {
      ...EMPTY_PROMOTION_FORM,
      name: '  کمپین تست  ',
      badgeText: '   ',
      customerDescription: '  توضیح  ',
      popupTitle: '  ',
      popupAcceptLabel: '  بگیر  ',
      startsAt: '1404/01/01',
      expiresAt: '1404/02/01',
    },
    helpers,
  );

  assert.equal(dto.name, 'کمپین تست');
  assert.equal(dto.badgeText, null);
  assert.equal(dto.customerDescription, 'توضیح');
  assert.equal(dto.popupTitle, null);
  assert.equal(dto.popupAcceptLabel, 'بگیر');
});

test('reward type follows the promotion type', () => {
  // جفت‌ها و درصدی‌ها پاداش درصدی/مبلغی دارند
  assert.equal(
    normalizeRewardType(
      PromotionType.CHEAPER_ITEM_PAIR,
      PromotionRewardType.PERCENTAGE,
    ),
    PromotionRewardType.PERCENTAGE,
  );

  // دریافت کالای رایگان همیشه FREE_ITEM است
  assert.equal(
    normalizeRewardType(
      PromotionType.BUY_X_GET_Y_SAME_GROUP,
      PromotionRewardType.PERCENTAGE,
    ),
    PromotionRewardType.FREE_ITEM,
  );

  assert.equal(
    normalizeRewardType(
      PromotionType.BUY_TRIGGER_GET_REWARD,
      PromotionRewardType.FIXED,
    ),
    PromotionRewardType.FREE_ITEM,
  );

  assert.equal(
    normalizeRewardType(
      PromotionType.FIXED_PRICE_BUNDLE,
      PromotionRewardType.PERCENTAGE,
    ),
    PromotionRewardType.FIXED_BUNDLE_PRICE,
  );

  assert.equal(
    normalizeRewardType(
      PromotionType.FREE_SHIPPING,
      PromotionRewardType.PERCENTAGE,
    ),
    PromotionRewardType.FREE_SHIPPING,
  );

  // اگر نوع جدید پاداش رایگان نمی‌خواهد، مقدار «کالای رایگان» به درصد برمی‌گردد
  assert.equal(
    normalizeRewardType(
      PromotionType.CART_DISCOUNT,
      PromotionRewardType.FREE_ITEM,
    ),
    PromotionRewardType.PERCENTAGE,
  );
});

test('the empty form is a valid starting point for the cheapest default', () => {
  assert.equal(EMPTY_PROMOTION_FORM.type, PromotionType.CHEAPER_ITEM_PAIR);
  assert.equal(EMPTY_PROMOTION_FORM.pairSize, 2);
  assert.equal(EMPTY_PROMOTION_FORM.isActive, true);
  assert.equal(EMPTY_PROMOTION_FORM.requiresCustomerAcceptance, true);
  assert.equal(EMPTY_PROMOTION_FORM.autoAddReward, false);
});
