import * as z from 'zod';

import { ShippingMethod } from '@/services/features/orders/type';

export const checkoutSchema = z
  .object({
    addressId: z.number().int().min(0),

    shippingMethod: z.enum([
      ShippingMethod.POST,
      ShippingMethod.COURIER,
      ShippingMethod.TIBAX,
      ShippingMethod.PICKUP,
    ]),

    note: z.string().optional(),

    discountCode: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.shippingMethod !== ShippingMethod.PICKUP && value.addressId < 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['addressId'],
        message: 'انتخاب آدرس الزامی است',
      });
    }
  });

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
