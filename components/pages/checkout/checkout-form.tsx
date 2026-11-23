'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Gift, Wallet } from 'lucide-react';
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
import {
  useCartList,
  useDeleteCartItem,
  useUpdateCartItem,
} from '@/services/features/cart/hooks';
import { useClubMe } from '@/services/features/club/hooks';
import { rialToToman } from '@/services/features/club/type';
import { useApplyDiscount } from '@/services/features/discounts/hooks';
import { ApplyDiscountResponse } from '@/services/features/discounts/types';
import { useFirstPurchaseGiftEligibility } from '@/services/features/first-purchase-gift/hooks';
import { confirmOrderFromWallet } from '@/services/features/orders/api';
import {
  useCheckoutPreview,
  useCreateOrder,
} from '@/services/features/orders/hooks';
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
import { useAuthStore } from '@/store/auth.store';

import { CheckoutFormValues, checkoutSchema } from './checkout-schema';
import CheckoutWizardShell from './checkout-wizard';
import {
  DEFAULT_DELIVERY_METHOD,
  getDeliveryMethods,
  getDeliveryType,
  isCheckoutSubmittable,
  restoreDeliveryMethod,
} from './delivery';
import OrderSummary, {
  CheckoutItemsList,
  CheckoutTotals,
} from './order-summary';
import { resolvePromotionTotals } from './promotion-totals';
import { calculateCheckoutShipping } from './shipping';

export default function CheckoutForm() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const { data: giftEligibilityResponse } = useFirstPurchaseGiftEligibility(
    Boolean(user),
    user?.id,
  );
  const [useFirstPurchaseGift, setUseFirstPurchaseGift] = useState(false);

  const { data: cartData, isLoading: cartLoading } = useCartList();

  const { data: addresses, isLoading: addressesLoading } = useAddresses();

  const createOrder = useCreateOrder();

  const startPayment = useStartPayment();

  const applyDiscountMutation = useApplyDiscount();

  const queryClient = useQueryClient();

  const { data: walletData } = useWallet();

  const { data: clubData, isLoading: clubLoading } = useClubMe();

  const walletInfo = walletData?.data ?? null;

  const walletBalance = Number(walletInfo?.balance ?? 0);

  const clubCreditBalance = Math.max(
    0,
    rialToToman(Number(clubData?.data?.AvailableCredit ?? 0)),
  );

  const [selectedAddressId, setSelectedAddressId] = useState<
    number | undefined
  >();

  // آخرین روش «ارسال» کاربر، تا با برگشت از حضوری دوباره انتخاب نشود
  const [lastDeliveryMethod, setLastDeliveryMethod] = useState<ShippingMethod>(
    DEFAULT_DELIVERY_METHOD,
  );

  const [selectedGatewayState, setSelectedGateway] =
    useState<PaymentGateway | null>(null);

  const [appliedDiscount, setAppliedDiscount] =
    useState<ApplyDiscountResponse | null>(null);

  const [useWalletPayment, setUseWalletPayment] = useState(false);

  const [useClubCreditPayment, setUseClubCreditPayment] = useState(false);

  /**
   * مرحلهٔ فعلی ویزارد موبایل (۰=سبد خرید، ۱=اطلاعات ارسال، ۲=پرداخت).
   * روی دسکتاپ هیچ اثری ندارد چون چیدمان ویزارد فقط زیر lg نمایش داده می‌شود.
   */
  const [wizardStep, setWizardStep] = useState(0);

  const cartItems = cartData?.data?.items ?? [];

  const updateCartItem = useUpdateCartItem();

  const deleteCartItem = useDeleteCartItem();

  const isUpdatingCart =
    updateCartItem.isPending ||
    deleteCartItem.isPending ||
    applyDiscountMutation.isPending;

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

  // همه‌ی رادیوهای «روش ارسال» روی همان فیلد shippingMethod ثبت میشوند
  const shippingMethodField = register('shippingMethod');

  const selectedShipping = useWatch({
    control: methods.control,
    name: 'shippingMethod',
  });

  const isPickup = getDeliveryType(selectedShipping) === 'pickup';

  /**
   * مبالغ معتبر سمت سرور: با هر تغییر سبد/روش ارسال دوباره محاسبه می‌شود تا
   * تخفیف پروموشن، کالای رایگان و ارسال رایگان در چک‌اوت همان چیزی باشد که
   * هنگام ثبت سفارش دوباره بررسی می‌شود.
   */
  const { data: checkoutPreviewData } = useCheckoutPreview({
    shippingMethod: selectedShipping,
    discountCode: appliedDiscount?.discount?.code,
    useFirstPurchaseGift,
  });

  const { isFreeShipping, shippingCost } = calculateCheckoutShipping(
    cartItems,
    selectedShipping,
    !!selectedAddressId,
  );

  const giftEligibility = giftEligibilityResponse?.data;
  const giftCanStackWithCode =
    giftEligibility?.config?.stackWithDiscountCodes ?? false;

  const baseFinalPrice = Number(
    appliedDiscount?.summary?.finalPrice ??
      cartData?.data?.pricing?.finalPrice ??
      0,
  );

  const estimatedFinalPrice = Number(
    checkoutPreviewData?.data?.totals.finalPrice ??
      baseFinalPrice + shippingCost,
  );

  const walletCreditUsed = useWalletPayment
    ? Math.min(walletBalance, Math.max(0, estimatedFinalPrice))
    : 0;
  const clubCreditUsed = useClubCreditPayment
    ? Math.min(
        clubCreditBalance,
        Math.max(0, estimatedFinalPrice - walletCreditUsed),
      )
    : 0;
  const creditsFullyCover =
    estimatedFinalPrice > 0 &&
    walletCreditUsed + clubCreditUsed >= estimatedFinalPrice;
  const gatewayPayable = Math.max(
    0,
    estimatedFinalPrice - walletCreditUsed - clubCreditUsed,
  );

  /**
   * اسنپ‌پی: مبلغ قابل پرداخت با درگاه به ریال. با هر تغییر سبد/ارسال/
   * تخفیف/کیف پول دوباره از اسنپ‌پی استعلام می‌شود و فقط اگر مجاز باشد،
   * با همان عنوان و توضیح داینامیک اسنپ‌پی در پایین نمایش داده می‌شود.
   */
  const snappayPayableToman = gatewayPayable;

  const snappayAmountIrr = Math.round(Math.max(0, snappayPayableToman) * 10);

  const { data: snappayEligibilityData } = useSnappayEligibility(
    { amount: snappayAmountIrr },
    snappayAmountIrr > 0 && !creditsFullyCover,
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

  // پیک فقط برای آدرس تهران؛ گزینه‌ی حضوری دیگر در لیست ارسال تکرار نمیشود
  const selectedAddress = addresses?.data?.find(
    address => address.id === selectedAddressId,
  );
  const deliveryMethods = getDeliveryMethods(selectedAddress?.city?.name);

  const handleDeliveryMethodChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    shippingMethodField.onChange(event);
    const value = event.target.value as ShippingMethod;
    if (value !== ShippingMethod.PICKUP && deliveryMethods.includes(value)) {
      setLastDeliveryMethod(value);
    }
  };

  const switchToPickup = () => {
    // «دریافت حضوری» همان PICKUP است؛ گزینه‌ی هدیش مال خودکار فعال میشود
    setValue('shippingMethod', ShippingMethod.PICKUP, {
      shouldValidate: true,
    });
  };

  const switchToDelivery = () => {
    // آدرس و آخرین روش ارسال قبلی حفظ میشوند (مگر دیگر معتبر نباشد)
    const method = restoreDeliveryMethod(lastDeliveryMethod, deliveryMethods);
    setLastDeliveryMethod(method);
    setValue('shippingMethod', method, { shouldValidate: true });
  };

  /**
   * ==========================================
   * اعمال کد تخفیف
   * ==========================================
   */

  const handleApplyDiscount = async () => {
    const code = getValues('discountCode')?.trim().toUpperCase();

    if (useFirstPurchaseGift && !giftCanStackWithCode) {
      toast.error('هدیهٔ اولین خرید با کد تخفیف همزمان استفاده نمی‌شود.');
      return;
    }

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
   * تغییر سبد خرید از صفحه تسویه
   * ==========================================
   */

  /**
   * مبلغ تخفیف ذخیره‌شده در فرانت بر اساس سبد قبلی محاسبه شده است. بعد از هر
   * تغییر تعداد یا حذف آیتم، کد تخفیف دوباره روی سبد جدید اعمال می‌شود تا
   * مبلغ نهایی و نمایش خلاصه سفارش با سرور هم‌خوان بماند.
   */
  const reapplyDiscount = async () => {
    const code = appliedDiscount?.discount?.code;

    if (!code) return;

    try {
      const response = await applyDiscountMutation.mutateAsync({ code });

      setAppliedDiscount(response.data);
    } catch (error: any) {
      setAppliedDiscount(null);

      toast.error(`کد تخفیف «${code}» با سبد جدید دیگر معتبر نیست؛ کد حذف شد`);

      console.error(error);
    }
  };

  const handleCartItemError = (error: any) => {
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        'خطا در به‌روزرسانی سبد خرید',
    );
  };

  const handleQuantityChange = async (itemId: number, quantity: number) => {
    try {
      if (quantity < 1) {
        await deleteCartItem.mutateAsync({ id: itemId });
      } else {
        await updateCartItem.mutateAsync({
          id: itemId,
          data: { quantity },
        });
      }
    } catch (error: any) {
      handleCartItemError(error);

      return;
    }

    await reapplyDiscount();
  };

  const handleRemoveCartItem = async (itemId: number) => {
    try {
      await deleteCartItem.mutateAsync({ id: itemId });
    } catch (error: any) {
      handleCartItemError(error);

      return;
    }

    await reapplyDiscount();
  };

  /**
   * ==========================================
   * ثبت سفارش و پرداخت
   * ==========================================
   */

  /**
   * کاربر موبایل را به مرحله‌ای از ویزارد می‌فرستد که خطای اعتبارسنجی به آن
   * مربوط است (بدون اثر روی دسکتاپ، چون ویزارد آنجا نمایش داده نمی‌شود).
   */
  const goToWizardStep = (step: number) => {
    setWizardStep(step);

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /** خطاهای اعتبارسنجی فرم (zod) — بازگشت خودکار به مرحلهٔ مرتبط */
  const onInvalidSubmit = () => {
    if (!isPickup && !getValues('addressId')) goToWizardStep(1);
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    if (!cartItems.length) {
      toast.error('سبد خرید شما خالی است');
      goToWizardStep(0);

      return;
    }

    if (data.shippingMethod !== ShippingMethod.PICKUP && !data.addressId) {
      toast.error('لطفاً آدرس تحویل را انتخاب کنید');
      goToWizardStep(1);

      return;
    }

    if (
      data.shippingMethod !== ShippingMethod.PICKUP &&
      !deliveryMethods.includes(data.shippingMethod)
    ) {
      toast.error('روش ارسال برای آدرس انتخاب‌شده در دسترس نیست');
      goToWizardStep(1);

      return;
    }

    if (!selectedGateway && !creditsFullyCover) {
      toast.error('لطفاً یک درگاه پرداخت انتخاب کنید');

      return;
    }

    if (
      useFirstPurchaseGift &&
      !giftCanStackWithCode &&
      data.discountCode?.trim()
    ) {
      toast.error('هدیهٔ اولین خرید با کد تخفیف همزمان استفاده نمی‌شود.');
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
        useClubCredit: useClubCreditPayment,
        useFirstPurchaseGift,
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

      const fullyCoveredByCredits =
        Number(order.walletPayment ?? 0) +
          Number(order.clubCreditPayment ?? 0) >=
        Number(order.finalPrice);

      if (order.status === OrderStatus.PAID) {
        toast.success('پرداخت با اعتبارهای انتخاب‌شده انجام شد');

        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['wallet'] });
        queryClient.invalidateQueries({ queryKey: ['club'] });

        router.push('/dashboard/orders');

        return;
      }

      if (fullyCoveredByCredits && order.status === OrderStatus.PENDING) {
        try {
          await confirmOrderFromWallet(order.id);

          toast.success('پرداخت با اعتبارهای انتخاب‌شده انجام شد');

          queryClient.invalidateQueries({ queryKey: ['wallet'] });
          queryClient.invalidateQueries({ queryKey: ['club'] });
        } catch (confirmError: any) {
          toast.error(
            confirmError?.response?.data?.message ||
              'سفارش ثبت شد اما تأیید پرداخت کامل نشد؛ می‌توانید از صفحه سفارشات تلاش مجدد کنید',
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

  /**
   * ==========================================
   * مرزهای اعتبارسنجی مراحل ویزارد موبایل
   * ==========================================
   * همان قواعدی که امروز هنگام ثبت سفارش اجرا می‌شوند؛ فقط زودتر و با پیام
   * فارسیِ مشخص در هر مرحله بررسی می‌شوند تا کاربر نتوانسته ناقص جلو برود.
   */
  const validateWizardStep = (current: number): boolean => {
    if (current === 0) {
      if (!cartItems.length) {
        toast.error('سبد خرید شما خالی است');
        return false;
      }
      return true;
    }

    if (current === 1) {
      // دریافت حضوری: آدرس لازم نیست
      if (isPickup) return true;
      if (!selectedAddressId) {
        toast.error('لطفاً آدرس تحویل را انتخاب کنید');
        return false;
      }
      if (!deliveryMethods.includes(selectedShipping)) {
        toast.error('روش ارسال برای آدرس انتخاب‌شده در دسترس نیست');
        return false;
      }
      return true;
    }

    return true;
  };

  /**
   * ==========================================
   * مقادیر مشترک خلاصه‌ها (ویزارد موبایل)
   * ==========================================
   */
  const promotionTotals = resolvePromotionTotals({
    preview: checkoutPreviewData?.data ?? null,
    pricing: cartData?.data?.pricing ?? null,
  });
  const payableTotal = promotionTotals.fromServer
    ? (checkoutPreviewData?.data?.totals.finalPrice ?? 0)
    : (appliedDiscount?.summary?.finalPrice ||
        cartData?.data?.pricing?.finalPrice ||
        0) + shippingCost;

  /**
   * ==========================================
   * بخش‌های محتوا (مشترک بین دسکتاپ و موبایل)
   * ==========================================
   * هر بخش فقط یک‌بار تعریف می‌شود تا منطق/ساختار دسکتاپ دقیقاً همان چیزی
   * بماند که بوده و ویزارد موبایل هم همان قواعد و همپوشانی را به ارث ببرد.
   */
  const deliveryContent = (
    <>
      {/* ================================= */}
      {/* نحوه دریافت (انتخاب بالا) */}
      {/* ================================= */}

      <section>
        <h2 className="text-xl font-light tracking-wide mb-4">نحوه دریافت</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-center gap-3 p-4 border rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="deliveryType"
              value="pickup"
              checked={isPickup}
              onChange={switchToPickup}
            />

            <div>
              <div className="font-medium">دریافت حضوری</div>

              <div className="text-xs text-gray-500">
                تحویل در فروشگاه، بدون هزینه ارسال
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 border rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="deliveryType"
              value="delivery"
              checked={!isPickup}
              onChange={switchToDelivery}
            />

            <div>
              <div className="font-medium">ارسال</div>

              <div className="text-xs text-gray-500">ارسال به آدرس شما</div>
            </div>
          </label>
        </div>
      </section>

      {isPickup ? (
        <section>
          <h2 className="text-xl font-light tracking-wide mb-4">روش تحویل</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <label className="flex items-center gap-3 p-4 border rounded-md cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="shippingMethod"
                value={ShippingMethod.PICKUP}
                checked
                onChange={switchToPickup}
              />
              <div>
                <div className="font-medium">تحویل حضوری در هدیش مال</div>
                <div className="text-xs text-green-600">بدون هزینه ارسال</div>
              </div>
            </label>
          </div>

          <p className="mt-3 text-sm text-gray-600">
            تحویل در هدیش مال انجام می‌شود و آدرس ارسال برای این سفارش ثبت
            نخواهد شد.
          </p>
        </section>
      ) : (
        <>
          <section>
            <h2 className="text-xl font-light tracking-wide mb-4">
              آدرس تحویل
            </h2>

            <p className="mb-3 text-sm text-gray-500">
              برای ارسال، انتخاب آدرس الزامی است.
            </p>

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
                  setLastDeliveryMethod(ShippingMethod.POST);
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
          </section>

          <section>
            <h2 className="text-xl font-light tracking-wide mb-4">روش ارسال</h2>

            {!selectedAddressId && (
              <p className="mb-3 text-sm text-gray-500">
                برای ارسال، ابتدا آدرس خود را انتخاب کنید.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {deliveryMethods.includes(ShippingMethod.POST) && (
                <label className="flex items-center gap-3 p-4 border rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value={ShippingMethod.POST}
                    {...shippingMethodField}
                    onChange={handleDeliveryMethodChange}
                  />

                  <div>
                    <div className="font-medium">پست</div>

                    <div className="text-xs text-gray-500">
                      {isFreeShipping ? 'رایگان' : '۱۷۰,۰۰۰ تومان'}
                    </div>
                  </div>
                </label>
              )}

              {deliveryMethods.includes(ShippingMethod.COURIER) && (
                <label className="flex items-center gap-3 p-4 border rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value={ShippingMethod.COURIER}
                    {...shippingMethodField}
                    onChange={handleDeliveryMethodChange}
                  />

                  <div>
                    <div className="font-medium">پیک</div>

                    <div className="text-xs text-green-600">
                      {isFreeShipping ? 'رایگان' : 'هزینه با مشتری'}
                    </div>
                  </div>
                </label>
              )}

              {deliveryMethods.includes(ShippingMethod.TIBAX) && (
                <label className="flex items-center gap-3 p-4 border rounded-md cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value={ShippingMethod.TIBAX}
                    {...shippingMethodField}
                    onChange={handleDeliveryMethodChange}
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
        </>
      )}
    </>
  );

  const giftContent = (
    <>
      {user && giftEligibility?.eligible && giftEligibility.config && (
        <section
          className="rounded-xl border border-rose-200 bg-gradient-to-l from-rose-50 via-white to-amber-50 p-4"
          aria-labelledby="first-purchase-gift-title"
        >
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={useFirstPurchaseGift}
              disabled={Boolean(appliedDiscount && !giftCanStackWithCode)}
              onChange={event => setUseFirstPurchaseGift(event.target.checked)}
              className="mt-1 h-4 w-4 accent-rose-800"
              aria-describedby="first-purchase-gift-description"
            />
            <span className="flex-1">
              <span
                className="flex items-center gap-2 font-semibold text-rose-950"
                id="first-purchase-gift-title"
              >
                <Gift className="h-4 w-4" aria-hidden="true" />
                {giftEligibility.config.title} —{' '}
                {giftEligibility.config.discountPercent}٪
              </span>
              <span
                id="first-purchase-gift-description"
                className="mt-1 block text-sm leading-6 text-stone-600"
              >
                {giftEligibility.config.description} این هدیه روی محصولات با
                قیمت عادی اعمال می‌شود.
              </span>
              {useFirstPurchaseGift && (
                <span className="mt-2 block text-sm font-semibold text-rose-900">
                  تخفیف هدیه در محاسبهٔ سفارش:{' '}
                  {Number(
                    checkoutPreviewData?.data?.totals
                      .firstPurchaseGiftDiscount ?? 0,
                  ).toLocaleString('fa-IR')}{' '}
                  تومان
                </span>
              )}
              {appliedDiscount && !giftCanStackWithCode && (
                <span className="mt-2 block text-xs text-amber-800">
                  برای استفاده از هدیه، ابتدا کد تخفیف فعلی را حذف کنید.
                </span>
              )}
            </span>
          </label>
        </section>
      )}
    </>
  );

  const paymentContent = (
    <>
      {/* ================================= */}
      {/* کد تخفیف */}
      {/* ================================= */}

      <section>
        <h2 className="text-xl font-light tracking-wide mb-4">کد تخفیف</h2>

        {appliedDiscount ? (
          <div className="border border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-green-700">
                  کد تخفیف{' '}
                  <span dir="ltr">{appliedDiscount.discount?.code}</span> اعمال
                  شد
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
        <h2 className="text-xl font-light tracking-wide mb-4">توضیحات سفارش</h2>

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
        <h2 className="text-xl font-light tracking-wide mb-4">روش پرداخت</h2>

        {(walletInfo || clubData?.data) && (
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
                موجودی کیف پول شما صفر است. برای شارژ به صفحه کیف پول مراجعه
                کنید.
              </p>
            )}

            {useWalletPayment &&
              creditsFullyCover &&
              estimatedFinalPrice > 0 && (
                <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  کل مبلغ سفارش ({formatPrice(estimatedFinalPrice)} تومان) از
                  اعتبارهای انتخاب‌شده پرداخت می‌شود.
                </p>
              )}

            {useWalletPayment &&
              estimatedFinalPrice > 0 &&
              walletCreditUsed > 0 &&
              !creditsFullyCover && (
                <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                  مبلغ باقی‌مانده ({formatPrice(gatewayPayable)} تومان) با درگاه
                  پرداخت می‌شود.
                </p>
              )}
          </div>
        )}

        {clubData?.data && (
          <div className="mb-3 space-y-2">
            <label
              className={`flex items-center gap-3 border-2 p-4 transition-all ${
                clubCreditBalance <= 0 || clubLoading
                  ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60'
                  : useClubCreditPayment
                    ? 'cursor-pointer border-primary bg-primary/5'
                    : 'cursor-pointer border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={useClubCreditPayment}
                onChange={e => setUseClubCreditPayment(e.target.checked)}
                disabled={clubCreditBalance <= 0 || clubLoading}
                className="h-4 w-4"
              />
              <div>
                <div className="font-medium">اعتبار باشگاه مشتریان</div>
                <div className="text-sm text-gray-500">
                  اعتبار قابل استفاده: {formatPrice(clubCreditBalance)} تومان
                </div>
              </div>
            </label>
            {clubCreditBalance <= 0 && (
              <p className="text-xs text-gray-500">
                اعتبار قابل استفاده‌ای در باشگاه مشتریان ندارید.
              </p>
            )}
            {useClubCreditPayment && clubCreditUsed > 0 && (
              <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                {formatPrice(clubCreditUsed)} تومان از اعتبار باشگاه کسر می‌شود
                {gatewayPayable > 0
                  ? ` و ${formatPrice(gatewayPayable)} تومان با درگاه پرداخت می‌شود.`
                  : ' و کل سفارش با اعتبار انتخاب‌شده پرداخت می‌شود.'}
              </p>
            )}
          </div>
        )}

        <div
          className={`space-y-3 ${
            creditsFullyCover ? 'pointer-events-none opacity-50' : ''
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
          <GatewayCard
            gateway={PaymentGateway.SNAPPAY}
            title={snappayEligibility?.title_message ?? ''}
            description={snappayEligibility?.description ?? ''}
            selectedGateway={selectedGateway}
            onSelect={setSelectedGateway}
            disabled={!snappayAvailable}
          />
        </div>
      </section>
    </>
  );

  // دکمهٔ ثبت داخل کارت سفید (فقط در چیدمان دسکتاپ نمایش داده می‌شود؛
  // در موبایل دکمهٔ نهایی در نوار پیمایش ویزارد است)
  const submitButton = (
    <Button
      type="submit"
      className="w-full"
      variant="dark"
      loading={createOrder.isPending || startPayment.isPending}
      disabled={
        !isCheckoutSubmittable({
          isPickup,
          hasSelectedAddress: !!selectedAddressId,
          hasGateway: !!selectedGateway,
          walletFullyCovers: creditsFullyCover,
        })
      }
    >
      {creditsFullyCover ? 'ثبت سفارش با اعتبار' : 'ثبت سفارش و پرداخت'}
    </Button>
  );

  // گام اول ویزارد: سبد خرید + خلاصهٔ مبالغ (بدون ردیف ارسال)
  const cartStepContent = (
    <section
      className="rounded-xl border border-gray-200 bg-white p-4"
      aria-labelledby="checkout-mobile-cart-title"
    >
      <h2
        id="checkout-mobile-cart-title"
        className="mb-3 text-base font-semibold"
      >
        سبد خرید
      </h2>
      <CheckoutItemsList
        items={cartItems}
        previewLines={checkoutPreviewData?.data?.lines ?? null}
        onQuantityChange={handleQuantityChange}
        onRemoveItem={handleRemoveCartItem}
        isUpdatingCart={isUpdatingCart}
        detailed
      />
      <CheckoutTotals
        appliedDiscount={appliedDiscount}
        pricing={cartData?.data?.pricing || null}
        shippingCost={shippingCost}
        isFreeShipping={isFreeShipping}
        hasSelectedAddress={!!selectedAddressId}
        isPickup={isPickup}
        promotionDiscount={promotionTotals.promotionDiscount}
        freeItemTotal={promotionTotals.freeItemValue}
        freeShippingFromPromotion={promotionTotals.freeShipping}
        promotionNotices={promotionTotals.notices}
        firstPurchaseGiftDiscount={Number(
          checkoutPreviewData?.data?.totals.firstPurchaseGiftDiscount ?? 0,
        )}
        payableTotal={payableTotal}
        hideShipping
      />
    </section>
  );

  // گام دوم ویزارد: نحوه دریافت، آدرس و روش ارسال
  const deliveryStepContent = (
    <section
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-4"
      aria-labelledby="checkout-mobile-delivery-title"
    >
      <h2
        id="checkout-mobile-delivery-title"
        className="text-base font-semibold"
      >
        اطلاعات ارسال
      </h2>
      {deliveryContent}
    </section>
  );

  // گام سوم ویزارد: هدیه/کد تخفیف، توضیحات، روش‌های پرداخت + خلاصه نهایی
  const paymentStepContent = (
    <div className="space-y-4">
      <section
        className="space-y-6 rounded-xl border border-gray-200 bg-white p-4"
        aria-labelledby="checkout-mobile-payment-title"
      >
        <h2
          id="checkout-mobile-payment-title"
          className="text-base font-semibold"
        >
          پرداخت
        </h2>
        {giftContent}
        {paymentContent}
      </section>
      <section
        className="rounded-xl border border-gray-200 bg-white p-4"
        aria-label="خلاصه نهایی سفارش"
      >
        <h3 className="text-sm font-semibold">خلاصه سفارش</h3>
        <CheckoutTotals
          appliedDiscount={appliedDiscount}
          pricing={cartData?.data?.pricing || null}
          shippingCost={shippingCost}
          isFreeShipping={isFreeShipping}
          hasSelectedAddress={!!selectedAddressId}
          isPickup={isPickup}
          promotionDiscount={promotionTotals.promotionDiscount}
          freeItemTotal={promotionTotals.freeItemValue}
          freeShippingFromPromotion={promotionTotals.freeShipping}
          promotionNotices={promotionTotals.notices}
          firstPurchaseGiftDiscount={Number(
            checkoutPreviewData?.data?.totals.firstPurchaseGiftDiscount ?? 0,
          )}
          payableTotal={payableTotal}
          walletCreditUsed={walletCreditUsed}
          clubCreditUsed={clubCreditUsed}
          gatewayPayable={gatewayPayable}
        />
      </section>
    </div>
  );

  return (
    <FormProvider
      methods={methods}
      onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}
    >
      {/* ===================================== */}
      {/* دسکتاپ: دقیقاً همان چیدمان قبلی */}
      {/* ===================================== */}
      <div dir="rtl" className="hidden lg:grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
            {deliveryContent}
            {giftContent}
            {paymentContent}
            {submitButton}
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <OrderSummary
            items={cartItems}
            pricing={cartData?.data?.pricing || null}
            checkoutPreview={checkoutPreviewData?.data ?? null}
            appliedDiscount={appliedDiscount}
            shippingCost={shippingCost}
            isFreeShipping={isFreeShipping}
            hasSelectedAddress={!!selectedAddressId}
            isPickup={isPickup}
            clubCreditUsed={clubCreditUsed}
            walletCreditUsed={walletCreditUsed}
            gatewayPayable={gatewayPayable}
            onQuantityChange={handleQuantityChange}
            onRemoveItem={handleRemoveCartItem}
            isUpdatingCart={isUpdatingCart}
          />
        </div>
      </div>

      {/* ===================================== */}
      {/* موبایل: ویزارد سه‌مرحله‌ای (فقط زیر lg) */}
      {/* ===================================== */}
      <div className="lg:hidden">
        <CheckoutWizardShell
          step={wizardStep}
          onStepChange={goToWizardStep}
          validateStep={validateWizardStep}
          hasCartItems={cartItems.length > 0}
          submitting={createOrder.isPending || startPayment.isPending}
          canSubmit={isCheckoutSubmittable({
            isPickup,
            hasSelectedAddress: !!selectedAddressId,
            hasGateway: !!selectedGateway,
            walletFullyCovers: creditsFullyCover,
          })}
          submitLabel={
            creditsFullyCover ? 'ثبت سفارش با اعتبار' : 'ثبت سفارش و پرداخت'
          }
          stepsContent={[
            cartStepContent,
            deliveryStepContent,
            paymentStepContent,
          ]}
        />
      </div>
    </FormProvider>
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
  disabled?: boolean;
}

function GatewayCard({
  gateway,
  title,
  description,
  selectedGateway,
  onSelect,
  disabled = false,
}: GatewayCardProps) {
  const selected = selectedGateway === gateway;

  return (
    <Card
      className={`border-2 transition-all ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={disabled ? undefined : () => onSelect(gateway)}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <input
          type="radio"
          checked={selected}
          onChange={disabled ? undefined : () => onSelect(gateway)}
          className="w-4 h-4"
          disabled={disabled}
        />

        <div>
          <div
            className={`font-medium ${disabled ? 'text-gray-400' : 'text-stone-900'}`}
          >
            {title}
          </div>

          <div
            className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-500'}`}
          >
            {description}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
