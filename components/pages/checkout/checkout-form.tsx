'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import Addresses from '@/components/dashboard/addresses';
import FormProvider from '@/components/form/form-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { useAddresses } from '@/services/features/addresses/hooks';
import { useCartList } from '@/services/features/cart/hooks';
import { useApplyDiscount } from '@/services/features/discounts/hooks';
import { ApplyDiscountResponse } from '@/services/features/discounts/types';
import { confirmOrderFromWallet } from '@/services/features/orders/api';
import { useCreateOrder } from '@/services/features/orders/hooks';
import {
  CreateOrderDto,
  OrderStatus,
  ShippingMethod,
} from '@/services/features/orders/type';
import {
  useSnappayEligibility,
  useStartPayment,
} from '@/services/features/payment/hooks';
import { PaymentGateway } from '@/services/features/payment/type';
import { useWallet } from '@/services/features/wallet/hooks';

import { CheckoutFormValues,checkoutSchema } from './checkout-schema';
import OrderSummary from './order-summary';
import { calculateCheckoutShipping } from './shipping';

export default function CheckoutForm() {
  const router = useRouter();

  const { data: cartData, isLoading: cartLoading } = useCartList();

  const { data: addresses, isLoading: addressesLoading } = useAddresses();

  const createOrder = useCreateOrder();

  const startPayment = useStartPayment();

  const applyDiscountMutation = useApplyDiscount();

  const queryClient = useQueryClient();

  const { data: walletData } = useWallet();

  const walletInfo = walletData?.data ?? null;

  const walletBalance = Number(walletInfo?.balance ?? 0);

  const [selectedAddressId, setSelectedAddressId] = useState<
    number | undefined
  >();

  const [selectedGatewayState, setSelectedGateway] =
    useState<PaymentGateway | null>(null);

  const [appliedDiscount, setAppliedDiscount] =
    useState<ApplyDiscountResponse | null>(null);

  const [useWalletPayment, setUseWalletPayment] = useState(false);

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

  const { handleSubmit, setValue, register, getValues } = methods;

  const selectedShipping = useWatch({
    control: methods.control,
    name: 'shippingMethod',
  });

  const { isFreeShipping, shippingCost } = calculateCheckoutShipping(
    cartItems,
    selectedShipping,
    !!selectedAddressId,
  );

  const baseFinalPrice = Number(
    appliedDiscount?.summary?.finalPrice ??
      cartData?.data?.pricing?.finalPrice ??
      0,
  );

  const estimatedFinalPrice = baseFinalPrice + shippingCost;

  const walletFullyCovers =
    useWalletPayment &&
    estimatedFinalPrice > 0 &&
    walletBalance >= estimatedFinalPrice;

  /**
   * اسنپ‌پی: مبلغ قابل پرداخت با درگاه به ریال. با هر تغییر سبد/ارسال/
   * تخفیف/کیف پول دوباره از اسنپ‌پی استعلام می‌شود و فقط اگر مجاز باشد،
   * با همان عنوان و توضیح داینامیک اسنپ‌پی در پایین نمایش داده می‌شود.
   */
  const snappayPayableToman =
    estimatedFinalPrice -
    (useWalletPayment
      ? Math.min(walletBalance, Math.max(0, estimatedFinalPrice))
      : 0);

  const snappayAmountIrr = Math.round(Math.max(0, snappayPayableToman) * 10);

  const { data: snappayEligibilityData } = useSnappayEligibility(
    { amount: snappayAmountIrr },
    snappayAmountIrr > 0 && !walletFullyCovers,
  );

  const snappayEligibility = snappayEligibilityData?.data;

  const snappayAvailable = Boolean(
    snappayEligibility?.eligible && snappayEligibility?.title_message,
  );

  // اگر استعلام اسنپ‌پی دیگر مجاز نباشد، انتخاب قبلی آن خودکار بی‌اثر می‌شود.
  const selectedGateway =
    selectedGatewayState === PaymentGateway.SNAPPAY &&
    snappayEligibility &&
    !snappayEligibility.eligible
      ? null
      : selectedGatewayState;

  // The courier option depends on the currently selected city; pickup is available everywhere.
  const selectedAddress = addresses?.data?.find(
    address => address.id === selectedAddressId,
  );
  const availableMethods = [
    ShippingMethod.POST,
    ShippingMethod.TIBAX,
    ShippingMethod.PICKUP,
  ];
  if (selectedAddress?.city?.name === 'تهران')
    availableMethods.push(ShippingMethod.COURIER);

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

      if (
        error?.response?.data?.message ===
          'این کد تخفیف شامل محصولات سبد خرید شما نمی‌شود.' &&
        (code === 'opening' || code === 'OPENING')
      ) {
        toast.error('این تخفیف شامل اکسسوری ها نمی شود.');
      } else {
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            'کد تخفیف معتبر نیست',
        );
      }

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

    if (data.shippingMethod !== ShippingMethod.PICKUP && !data.addressId) {
      toast.error('لطفاً آدرس تحویل را انتخاب کنید');

      return;
    }

    if (!availableMethods.includes(data.shippingMethod)) {
      toast.error('روش ارسال برای آدرس انتخاب‌شده در دسترس نیست');
      return;
    }

    if (!selectedGateway && !walletFullyCovers) {
      toast.error('لطفاً یک درگاه پرداخت انتخاب کنید');

      return;
    }

    try {
      const orderData: CreateOrderDto = {
        addressId:
          data.shippingMethod === ShippingMethod.PICKUP
            ? undefined
            : data.addressId,

        shippingMethod: data.shippingMethod,

        note: data.note?.trim() || undefined,

        discountCode: data.discountCode?.trim()
          ? data.discountCode.trim().toUpperCase()
          : undefined,

        useWallet: useWalletPayment,
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

      const fullyCoveredByWallet =
        Number(order.walletPayment ?? 0) > 0 &&
        Number(order.walletPayment) >= Number(order.finalPrice);

      if (order.status === OrderStatus.PAID) {
        toast.success('پرداخت با کیف پول انجام شد');

        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['wallet'] });

        router.push('/dashboard/orders');

        return;
      }

      if (fullyCoveredByWallet && order.status === OrderStatus.PENDING) {
        try {
          await confirmOrderFromWallet(order.id);

          toast.success('پرداخت با کیف پول انجام شد');

          queryClient.invalidateQueries({ queryKey: ['wallet'] });
        } catch (confirmError: any) {
          toast.error(
            confirmError?.response?.data?.message ||
              'سفارش ثبت شد اما تأیید کیف پول کامل نشد؛ می‌توانید از صفحه سفارشات تلاش مجدد کنید',
          );
        }

        queryClient.invalidateQueries({ queryKey: ['orders'] });

        router.push('/dashboard/orders');

        return;
      }

      /**
       * ========================================
       * شروع پرداخت
       * ========================================
       */

      if (!selectedGateway) {
        router.push(`/checkout/payment?orderId=${order.id}`);

        return;
      }

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

              <p className="mb-3 text-sm text-gray-500">
                برای ارسال انتخاب آدرس الزامی است؛ برای تحویل حضوری نیازی به
                آدرس نیست.
              </p>
              {selectedShipping === ShippingMethod.PICKUP ? (
                <p className="text-sm text-gray-600">
                  تحویل در هدیش مال انجام می‌شود و آدرس ارسال برای این سفارش ثبت
                  نخواهد شد.
                </p>
              ) : (
                <>
                  <Addresses
                    mode="checkout"
                    selectedAddressId={selectedAddressId}
                    onAddressSelect={id => {
                      const newAddress = addresses?.data?.find(
                        address => address.id === id,
                      );
                      if (
                        selectedShipping === ShippingMethod.COURIER &&
                        newAddress?.city?.name !== 'تهران'
                      ) {
                        setValue('shippingMethod', ShippingMethod.POST, {
                          shouldValidate: true,
                        });
                      }
                      setSelectedAddressId(id);

                      setValue('addressId', id, {
                        shouldValidate: true,
                      });
                    }}
                  />
                  {methods.formState.errors.addressId && (
                    <p role="alert" className="mt-2 text-sm text-red-600">
                      {methods.formState.errors.addressId.message}
                    </p>
                  )}
                </>
              )}
            </section>

            {/* ================================= */}
            {/* ارسال */}
            {/* ================================= */}

            <section>
              <h2 className="text-xl font-light tracking-wide mb-4">
                روش ارسال
              </h2>

              {!selectedAddressId &&
                selectedShipping !== ShippingMethod.PICKUP && (
                  <p className="mb-3 text-sm text-gray-500">
                    برای ارسال، ابتدا آدرس خود را انتخاب کنید.
                  </p>
                )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
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
                        {isFreeShipping ? 'رایگان' : '۱۷۰,۰۰۰ تومان'}
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
                        {isFreeShipping ? 'رایگان' : 'هزینه با مشتری'}
                      </div>
                    </div>
                  </label>
                )}

                {availableMethods.includes(ShippingMethod.PICKUP) && (
                  <label className="flex items-center gap-3 p-4 border rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      value={ShippingMethod.PICKUP}
                      {...register('shippingMethod')}
                    />
                    <div>
                      <div className="font-medium">تحویل حضوری در هدیش مال</div>
                      <div className="text-xs text-green-600">
                        بدون هزینه ارسال
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
                        {isFreeShipping ? 'رایگان' : 'هزینه با مشتری'}
                      </div>
                    </div>
                  </label>
                )}
              </div>
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

              {walletInfo && (
                <div className="space-y-3 mb-3">
                  <label
                    className={`flex items-center gap-3 border-2 p-4 transition-all ${
                      walletBalance <= 0
                        ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60'
                        : useWalletPayment
                          ? 'cursor-pointer border-primary bg-primary/5'
                          : 'cursor-pointer border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={useWalletPayment}
                      onChange={e => setUseWalletPayment(e.target.checked)}
                      disabled={walletBalance <= 0}
                      className="w-4 h-4"
                    />

                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        <Wallet className="w-4 h-4" strokeWidth={1.5} />
                        پرداخت از کیف پول
                      </div>

                      <div className="text-sm text-gray-500">
                        موجودی: {formatPrice(walletBalance)} تومان
                      </div>
                    </div>
                  </label>

                  {walletBalance <= 0 && (
                    <p className="text-xs text-gray-500">
                      موجودی کیف پول شما صفر است. برای شارژ به صفحه کیف پول
                      مراجعه کنید.
                    </p>
                  )}

                  {useWalletPayment &&
                    walletFullyCovers &&
                    estimatedFinalPrice > 0 && (
                      <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                        کل مبلغ سفارش ({formatPrice(estimatedFinalPrice)} تومان)
                        از کیف پول پرداخت می‌شود.
                      </p>
                    )}

                  {useWalletPayment &&
                    estimatedFinalPrice > 0 &&
                    walletBalance > 0 &&
                    walletBalance < estimatedFinalPrice && (
                      <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                        مبلغ باقی‌مانده (
                        {formatPrice(estimatedFinalPrice - walletBalance)}{' '}
                        تومان) با کارت بانکی پرداخت می‌شود.
                      </p>
                    )}
                </div>
              )}

              <div
                className={`space-y-3 ${
                  walletFullyCovers ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                {' '}
                {/* <GatewayCard
                  gateway={PaymentGateway.MELLAT}
                  title="بانک ملت"
                  description="درگاه شتاب"
                  selectedGateway={selectedGateway}
                  onSelect={setSelectedGateway}
                /> */}
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
                {snappayAvailable && (
                  <GatewayCard
                    gateway={PaymentGateway.SNAPPAY}
                    title={snappayEligibility?.title_message ?? ''}
                    description={snappayEligibility?.description ?? ''}
                    selectedGateway={selectedGateway}
                    onSelect={setSelectedGateway}
                  />
                )}
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
              disabled={
                !selectedAddressId || (!walletFullyCovers && !selectedGateway)
              }
            >
              {walletFullyCovers
                ? 'ثبت سفارش با کیف پول'
                : 'ثبت سفارش و پرداخت'}
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
          isFreeShipping={isFreeShipping}
          hasSelectedAddress={!!selectedAddressId}
          isPickup={selectedShipping === ShippingMethod.PICKUP}
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
