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
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAddresses } from '@/services/features/addresses/hooks';
import { useCartList } from '@/services/features/cart/hooks';
import { useApplyDiscount } from '@/services/features/discounts/hooks';
import { ApplyDiscountResponse } from '@/services/features/discounts/types';
import { useCreateOrder } from '@/services/features/orders/hooks';
import {
  CreateOrderDto,
  ShippingMethod,
} from '@/services/features/orders/type';
import { useStartPayment } from '@/services/features/payment/hooks';
import { PaymentGateway } from '@/services/features/payment/type';

import OrderSummary from './order-summary';

const checkoutSchema = z.object({
  addressId: z.number().min(1, 'انتخاب آدرس الزامی است'),

  shippingMethod: z.enum([
    ShippingMethod.POST,
    ShippingMethod.COURIER,
    ShippingMethod.TIBAX,
  ]),

  note: z.string().optional(),

  discountCode: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutForm() {
  const router = useRouter();

  const { data: cartData, isLoading: cartLoading } = useCartList();

  const { data: addresses, isLoading: addressesLoading } = useAddresses();

  const createOrder = useCreateOrder();

  const startPayment = useStartPayment();

  const applyDiscountMutation = useApplyDiscount();

  const [selectedAddressId, setSelectedAddressId] = useState<
    number | undefined
  >();

  const [shippingCost, setShippingCost] = useState(0);

  const [availableMethods, setAvailableMethods] = useState<ShippingMethod[]>([
    ShippingMethod.POST,
    ShippingMethod.TIBAX,
  ]);

  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(
    null,
  );

  const [appliedDiscount, setAppliedDiscount] =
    useState<ApplyDiscountResponse | null>(null);

  const cartItems = cartData?.data?.items ?? [];

  const methods = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),

    defaultValues: {
      addressId: 0,
      shippingMethod: ShippingMethod.POST,
      note: '',
      discountCode: '',
    },
  });

  const { handleSubmit, watch, setValue, register, getValues } = methods;

  const selectedShipping = watch('shippingMethod');

  /**
   * ==========================================
   * تغییر روش ارسال بر اساس شهر
   * ==========================================
   */

  useEffect(() => {
    if (!selectedAddressId || !addresses?.data) {
      return;
    }

    const address = addresses.data.find(
      address => address.id === selectedAddressId,
    );

    if (!address) {
      return;
    }

    const isTehran = address.city?.name === 'تهران';

    const methods: ShippingMethod[] = [
      ShippingMethod.POST,
      ShippingMethod.TIBAX,
    ];

    if (isTehran) {
      methods.push(ShippingMethod.COURIER);
    }

    setAvailableMethods(methods);

    if (!methods.includes(selectedShipping)) {
      setValue('shippingMethod', ShippingMethod.POST, {
        shouldValidate: true,
      });
    }
  }, [selectedAddressId, addresses, selectedShipping, setValue]);

  /**
   * ==========================================
   * هزینه ارسال
   * ==========================================
   */

  useEffect(() => {
    if (!selectedAddressId) {
      setShippingCost(0);
      return;
    }

    switch (selectedShipping) {
      case ShippingMethod.POST:
        setShippingCost(170000);
        break;

      case ShippingMethod.COURIER:
      case ShippingMethod.TIBAX:
        /**
         * هزینه توسط مشتری پرداخت می‌شود
         */
        setShippingCost(0);
        break;

      default:
        setShippingCost(0);
    }
  }, [selectedShipping, selectedAddressId]);

  /**
   * ==========================================
   * اعمال کد تخفیف
   * ==========================================
   */

  const handleApplyDiscount = async () => {
    const code = getValues('discountCode')?.trim().toUpperCase();

    if (!code) {
      toast.error('لطفاً کد تخفیف را وارد کنید');

      setAppliedDiscount(null);

      return;
    }

    if (!cartItems.length) {
      toast.error('سبد خرید شما خالی است');

      return;
    }

    try {
      const response = await applyDiscountMutation.mutateAsync({
        code,
      });

      const discountAmount = Number(response.data.summary.discountPrice);

      setAppliedDiscount(response.data);

      toast.success(
        `کد تخفیف اعمال شد؛ ${discountAmount.toLocaleString()} تومان تخفیف`,
      );
    } catch (error: any) {
      setAppliedDiscount(null);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'کد تخفیف معتبر نیست',
      );

      console.error(error);
    }
  };

  /**
   * ==========================================
   * حذف کد تخفیف
   * ==========================================
   */

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);

    setValue('discountCode', '');

    toast.success('کد تخفیف حذف شد');
  };

  /**
   * ==========================================
   * ثبت سفارش و پرداخت
   * ==========================================
   */

  const onSubmit = async (data: CheckoutFormValues) => {
    if (!cartItems.length) {
      toast.error('سبد خرید شما خالی است');

      return;
    }

    if (!data.addressId) {
      toast.error('لطفاً آدرس تحویل را انتخاب کنید');

      return;
    }

    if (!selectedGateway) {
      toast.error('لطفاً یک درگاه پرداخت انتخاب کنید');

      return;
    }

    try {
      const orderData: CreateOrderDto = {
        addressId: data.addressId,

        shippingMethod: data.shippingMethod,

        note: data.note?.trim() || undefined,

        discountCode: data.discountCode?.trim()
          ? data.discountCode.trim().toUpperCase()
          : undefined,
      };

      /**
       * ساخت سفارش
       */

      const orderResponse = await createOrder.mutateAsync(orderData);

      const order = orderResponse.data;

      if (!order?.id) {
        toast.error('سفارش ایجاد نشد');

        return;
      }

      /**
       * ========================================
       * شروع پرداخت
       * ========================================
       */

      startPayment.mutate(
        {
          orderId: order.id,
          gateway: selectedGateway,
        },

        {
          onSuccess: response => {
            const payment = response.data;

            if (!payment?.payUrl) {
              toast.error('آدرس پرداخت دریافت نشد');

              return;
            }

            /**
             * انتقال به درگاه
             */

            window.location.href = payment.payUrl;
          },

          onError: (error: any) => {
            toast.error(
              error?.response?.data?.message ||
                error?.message ||
                'خطا در شروع پرداخت',
            );
          },
        },
      );
    } catch (error: any) {
      /**
       * ممکن است کد تخفیف در فاصله بین
       * Apply و Create Order نامعتبر شده باشد.
       *
       * بنابراین خطای Backend را نمایش می‌دهیم.
       */

      toast.error(
        error?.response?.data?.message || error?.message || 'خطا در ثبت سفارش',
      );

      /**
       * اگر مشکل مربوط به تخفیف باشد،
       * state فرانت را هم پاک می‌کنیم.
       */

      setAppliedDiscount(null);
    }
  };

  /**
   * ==========================================
   * Loading
   * ==========================================
   */

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

  /**
   * ==========================================
   * Empty cart
   * ==========================================
   */

  if (!cartItems.length) {
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

  /**
   * ==========================================
   * UI
   * ==========================================
   */

  return (
    <div dir="rtl" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ===================================== */}
      {/* Checkout */}
      {/* ===================================== */}

      <div className="lg:col-span-2">
        <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
            {/* ================================= */}
            {/* آدرس */}
            {/* ================================= */}

            <section>
              <h2 className="text-xl font-light tracking-wide mb-4">
                آدرس تحویل
              </h2>

              <Addresses
                mode="checkout"
                selectedAddressId={selectedAddressId}
                onAddressSelect={id => {
                  setSelectedAddressId(id);

                  setValue('addressId', id, {
                    shouldValidate: true,
                  });
                }}
              />
            </section>

            {/* ================================= */}
            {/* ارسال */}
            {/* ================================= */}

            <section>
              <h2 className="text-xl font-light tracking-wide mb-4">
                روش ارسال
              </h2>

              {!selectedAddressId ? (
                <p className="text-sm text-gray-500">
                  لطفاً ابتدا آدرس خود را انتخاب کنید.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {availableMethods.includes(ShippingMethod.POST) && (
                    <label className="flex items-center gap-3 p-4 border rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        value={ShippingMethod.POST}
                        {...register('shippingMethod')}
                      />

                      <div>
                        <div className="font-medium">پست</div>

                        <div className="text-xs text-gray-500">
                          ۱۷۰,۰۰۰ تومان
                        </div>
                      </div>
                    </label>
                  )}

                  {availableMethods.includes(ShippingMethod.COURIER) && (
                    <label className="flex items-center gap-3 p-4 border rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        value={ShippingMethod.COURIER}
                        {...register('shippingMethod')}
                      />

                      <div>
                        <div className="font-medium">پیک</div>

                        <div className="text-xs text-green-600">
                          هزینه با مشتری
                        </div>
                      </div>
                    </label>
                  )}

                  {availableMethods.includes(ShippingMethod.TIBAX) && (
                    <label className="flex items-center gap-3 p-4 border rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        value={ShippingMethod.TIBAX}
                        {...register('shippingMethod')}
                      />

                      <div>
                        <div className="font-medium">تیباکس</div>

                        <div className="text-xs text-green-600">
                          هزینه با مشتری
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              )}
            </section>

            {/* ================================= */}
            {/* کد تخفیف */}
            {/* ================================= */}

            <section>
              <h2 className="text-xl font-light tracking-wide mb-4">
                کد تخفیف
              </h2>

              {appliedDiscount ? (
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-green-700">
                        کد تخفیف{' '}
                        <span dir="ltr">{appliedDiscount.discount?.code}</span>{' '}
                        اعمال شد
                      </p>

                      <p className="text-sm text-green-600 mt-1">
                        {appliedDiscount.summary?.discountPrice.toLocaleString()}{' '}
                        تومان تخفیف
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveDiscount}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    {...register('discountCode')}
                    placeholder="کد تخفیف را وارد کنید"
                    dir="ltr"
                    className="flex-1"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleApplyDiscount}
                    loading={applyDiscountMutation.isPending}
                  >
                    اعمال
                  </Button>
                </div>
              )}

              {!appliedDiscount && (
                <p className="text-xs text-gray-500 mt-2">
                  کد تخفیف خود را وارد کنید و روی «اعمال» بزنید.
                </p>
              )}
            </section>

            {/* ================================= */}
            {/* توضیحات */}
            {/* ================================= */}

            <section>
              <h2 className="text-xl font-light tracking-wide mb-4">
                توضیحات سفارش
              </h2>

              <textarea
                {...register('note')}
                className="w-full border rounded-md p-3 text-sm"
                rows={3}
                placeholder="توضیحات سفارش..."
              />
            </section>

            {/* ================================= */}
            {/* پرداخت */}
            {/* ================================= */}

            <section>
              <h2 className="text-xl font-light tracking-wide mb-4">
                روش پرداخت
              </h2>

              <div className="space-y-3">
                <GatewayCard
                  gateway={PaymentGateway.MELLAT}
                  title="بانک ملت"
                  description="درگاه شتاب"
                  selectedGateway={selectedGateway}
                  onSelect={setSelectedGateway}
                />

                <GatewayCard
                  gateway={PaymentGateway.ZARINPAL}
                  title="زرین‌پال"
                  description="درگاه اینترنتی"
                  selectedGateway={selectedGateway}
                  onSelect={setSelectedGateway}
                />

                <GatewayCard
                  gateway={PaymentGateway.DIGIPAY}
                  title="دیجی‌پی"
                  description="درگاه اینترنتی"
                  selectedGateway={selectedGateway}
                  onSelect={setSelectedGateway}
                />

                <GatewayCard
                  gateway={PaymentGateway.TARA}
                  title="تارا"
                  description="درگاه اینترنتی"
                  selectedGateway={selectedGateway}
                  onSelect={setSelectedGateway}
                />
              </div>
            </section>

            {/* ================================= */}
            {/* Submit */}
            {/* ================================= */}

            <Button
              type="submit"
              className="w-full"
              variant="dark"
              loading={createOrder.isPending || startPayment.isPending}
              disabled={!selectedAddressId || !selectedGateway}
            >
              ثبت سفارش و پرداخت
            </Button>
          </div>
        </FormProvider>
      </div>

      {/* ===================================== */}
      {/* Summary */}
      {/* ===================================== */}

      <div className="lg:col-span-1">
        <OrderSummary
          items={cartItems}
          pricing={cartData?.data?.pricing || null}
          appliedDiscount={appliedDiscount}
          shippingCost={shippingCost}
        />
      </div>
    </div>
  );
}

/* ========================================= */
/* Gateway Card */
/* ========================================= */

interface GatewayCardProps {
  gateway: PaymentGateway;
  title: string;
  description: string;
  selectedGateway: PaymentGateway | null;
  onSelect: (gateway: PaymentGateway) => void;
}

function GatewayCard({
  gateway,
  title,
  description,
  selectedGateway,
  onSelect,
}: GatewayCardProps) {
  const selected = selectedGateway === gateway;

  return (
    <Card
      className={`cursor-pointer border-2 transition-all ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onSelect(gateway)}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <input
          type="radio"
          checked={selected}
          onChange={() => onSelect(gateway)}
          className="w-4 h-4"
        />

        <div>
          <div className="font-medium">{title}</div>

          <div className="text-sm text-gray-500">{description}</div>
        </div>
      </CardContent>
    </Card>
  );
}
