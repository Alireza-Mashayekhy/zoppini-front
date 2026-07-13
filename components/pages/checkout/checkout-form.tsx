// components/pages/checkout/checkout-form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import Addresses from '@/components/dashboard/addresses';
import FormProvider from '@/components/form/form-provider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAddresses } from '@/services/features/addresses/hooks';
import { useCartList } from '@/services/features/cart/hooks';
import { useCreateOrder } from '@/services/features/orders/hooks';
import {
  CreateOrderDto,
  ShippingMethod,
} from '@/services/features/orders/type';

import OrderSummary from './order-summary';

const checkoutSchema = z.object({
  addressId: z.number().min(1, 'انتخاب آدرس الزامی است'),
  shippingMethod: z.enum(['post', 'courier', 'tibax']),
  note: z.string().optional(),
});

export default function CheckoutForm() {
  const router = useRouter();
  const { data: cartData, isLoading: cartLoading } = useCartList();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const createOrder = useCreateOrder();

  const [shippingCost, setShippingCost] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState<
    number | undefined
  >();
  const [availableMethods, setAvailableMethods] = useState<ShippingMethod[]>([
    ShippingMethod.POST,
    ShippingMethod.TIBAX,
  ]);

  const cartItems = cartData?.data?.items || [];
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0,
  );

  const methods = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      addressId: 0,
      shippingMethod: ShippingMethod.POST,
      note: '',
    },
  });

  const { handleSubmit, watch, setValue } = methods;
  const selectedShipping = watch('shippingMethod');

  // به‌روزرسانی روش‌های ارسال بر اساس شهر
  useEffect(() => {
    if (selectedAddressId && addresses) {
      const address = addresses?.data?.find(a => a.id === selectedAddressId);
      if (address) {
        const isTehran = address.city?.name === 'تهران';
        const methods: ShippingMethod[] = [
          ShippingMethod.POST,
          ShippingMethod.TIBAX,
        ];
        if (isTehran) {
          methods.push(ShippingMethod.COURIER);
        }
        setAvailableMethods(methods);
        // اگر روش فعلی در لیست نیست، به POST تغییر بده
        if (!methods.includes(watch('shippingMethod') as ShippingMethod)) {
          setValue('shippingMethod', ShippingMethod.POST);
        }
      }
    }
  }, [selectedAddressId, addresses, watch, setValue]);

  // محاسبه هزینه ارسال
  useEffect(() => {
    if (selectedAddressId && addresses) {
      const address = addresses?.data?.find(a => a.id === selectedAddressId);
      if (address) {
        switch (selectedShipping) {
          case ShippingMethod.POST:
            setShippingCost(170000);
            break;
          case ShippingMethod.COURIER:
          case ShippingMethod.TIBAX:
            setShippingCost(0);
            break;
          default:
            setShippingCost(0);
        }
      }
    }
  }, [selectedShipping, selectedAddressId, addresses]);

  const finalPrice = totalPrice + shippingCost;

  const onSubmit = async (data: any) => {
    if (cartItems.length === 0) {
      toast.error('سبد خرید شما خالی است');
      return;
    }

    try {
      const orderData: CreateOrderDto = {
        addressId: data.addressId,
        shippingMethod: data.shippingMethod,
        note: data.note,
        discount: 0,
      };
      await createOrder.mutateAsync(orderData);
      toast.success('سفارش با موفقیت ثبت شد');
      router.push('/dashboard/orders');
    } catch (error: any) {
      toast.error(error?.message || 'خطا در ثبت سفارش');
    }
  };

  if (cartLoading || addressesLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">سبد خرید شما خالی است</p>
        <Button
          variant="dark"
          className="mt-4"
          onClick={() => router.push('/products')}
        >
          بازگشت به فروشگاه
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-light tracking-wide">آدرس تحویل</h2>

            <Addresses
              mode="checkout"
              selectedAddressId={selectedAddressId}
              onAddressSelect={id => {
                setSelectedAddressId(id);
                setValue('addressId', id);
              }}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                روش ارسال
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {availableMethods.includes(ShippingMethod.POST) && (
                  <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value={ShippingMethod.POST}
                      {...methods.register('shippingMethod')}
                    />
                    <span>پست</span>
                    <span className="text-xs text-gray-500">
                      ({shippingCost.toLocaleString()} تومان)
                    </span>
                  </label>
                )}
                {availableMethods.includes(ShippingMethod.COURIER) && (
                  <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value={ShippingMethod.COURIER}
                      {...methods.register('shippingMethod')}
                    />
                    <span>پیک</span>
                    <span className="text-xs text-green-600">
                      (هزینه با مشتری)
                    </span>
                  </label>
                )}
                {availableMethods.includes(ShippingMethod.TIBAX) && (
                  <label className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value={ShippingMethod.TIBAX}
                      {...methods.register('shippingMethod')}
                    />
                    <span>تیباکس</span>
                    <span className="text-xs text-green-600">
                      (هزینه با مشتری)
                    </span>
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                توضیحات (اختیاری)
              </label>
              <textarea
                {...methods.register('note')}
                className="w-full border rounded-md p-2 text-sm"
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-6"
              variant="dark"
              loading={createOrder.isPending}
            >
              ثبت سفارش
            </Button>
          </div>
        </FormProvider>
      </div>

      <div className="lg:col-span-1">
        <OrderSummary
          items={cartItems}
          totalPrice={totalPrice}
          shippingCost={shippingCost}
          finalPrice={finalPrice}
        />
      </div>
    </div>
  );
}
