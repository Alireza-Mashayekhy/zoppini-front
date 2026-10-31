import assert from 'node:assert/strict';
import { test } from 'node:test';

import { checkoutSchema } from '../components/pages/checkout/checkout-schema';
import { calculateCheckoutShipping } from '../components/pages/checkout/shipping';
import { ShippingMethod } from '../services/features/orders/type';

test('pickup has no shipping charge whether or not an address is selected', () => {
  const items = [{ quantity: 1, variant: { price: 500000 } }];
  assert.equal(
    calculateCheckoutShipping(items, ShippingMethod.PICKUP, false).shippingCost,
    0,
  );
  assert.equal(
    calculateCheckoutShipping(items, ShippingMethod.PICKUP, true).shippingCost,
    0,
  );
  assert.equal(
    calculateCheckoutShipping(items, ShippingMethod.POST, true).shippingCost,
    170000,
  );
  assert.equal(
    calculateCheckoutShipping(items, ShippingMethod.COURIER, true).shippingCost,
    0,
  );
});

test('checkout requires an address only for delivery', () => {
  const values = {
    addressId: 0,
    shippingMethod: ShippingMethod.PICKUP,
    note: '',
    discountCode: '',
  };
  assert.equal(checkoutSchema.safeParse(values).success, true);
  assert.equal(
    checkoutSchema.safeParse({ ...values, shippingMethod: ShippingMethod.POST })
      .success,
    false,
  );
  assert.equal(
    checkoutSchema.safeParse({
      ...values,
      shippingMethod: ShippingMethod.POST,
      addressId: 1,
    }).success,
    true,
  );
});
