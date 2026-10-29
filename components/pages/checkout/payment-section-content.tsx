'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  useSnappayEligibility,
  useStartPayment,
} from '@/services/features/payment/hooks';
import { PaymentGateway } from '@/services/features/payment/type';

export default function PaymentSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [selectedGatewayState, setSelectedGateway] =
    useState<PaymentGateway | null>(
    null,
  );
  const { mutate, isPending } = useStartPayment();

  // اسنپ‌پی: مبلغ از روی همین سفارش سمت سرور محاسبه و استعلام می‌شود؛
  // فقط در صورت eligible بودن با عنوان/توضیح داینامیک اسنپ‌پی نمایش داده می‌شود.
  const { data: snappayEligibilityData } = useSnappayEligibility(
    { orderId: orderId ? Number(orderId) : undefined },
    Boolean(orderId),
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

  const handlePayment = () => {
    if (!orderId) {
      toast.error('شناسه سفارش یافت نشد');
      router.push('/dashboard/orders');
      return;
    }

    if (!selectedGateway) {
      toast.error('لطفاً یک درگاه پرداخت انتخاب کنید');
      return;
    }

    mutate(
      {
        orderId: Number(orderId),
        gateway: selectedGateway,
      },
      {
        onSuccess: response => {
          const payment = response.data;

          if (!payment?.payUrl) {
            toast.error('آدرس پرداخت دریافت نشد');
            return;
          }

          // زرین‌پال: انتقال مستقیم به URL
          if (selectedGateway === PaymentGateway.ZARINPAL) {
            window.location.href = payment.payUrl;
            return;
          }

          // سایر درگاه‌ها
          // بسته به نوع درگاه باید روش redirect مخصوص خودشان استفاده شود.
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
  };

  return (
    <div className="container max-w-md mx-auto py-10 px-4">
      <h1 className="text-2xl font-light text-center mb-2">
        انتخاب درگاه پرداخت
      </h1>
      <p className="text-center text-gray-500 text-sm mb-8">
        لطفاً درگاه مورد نظر خود را انتخاب کنید
      </p>

      <div className="space-y-4">
        {/* <Card
          className={`cursor-pointer border-2 transition-all ${
            selectedGateway === PaymentGateway.MELLAT
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedGateway(PaymentGateway.MELLAT)}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <input
              type="radio"
              checked={selectedGateway === PaymentGateway.MELLAT}
              onChange={() => setSelectedGateway(PaymentGateway.MELLAT)}
              className="w-4 h-4"
            />
            <span className="font-medium">بانک ملت</span>
            <span className="text-sm text-gray-500">(درگاه شتاب)</span>
          </CardContent>
        </Card> */}
        <Card
          className={`cursor-pointer border-2 transition-all ${
            selectedGateway === PaymentGateway.ZARINPAL
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedGateway(PaymentGateway.ZARINPAL)}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <input
              type="radio"
              checked={selectedGateway === PaymentGateway.ZARINPAL}
              onChange={() => setSelectedGateway(PaymentGateway.ZARINPAL)}
              className="w-4 h-4"
            />
            <span className="font-medium">زرین‌پال</span>
            <span className="text-sm text-gray-500">(درگاه اینترنتی)</span>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer border-2 transition-all ${
            selectedGateway === PaymentGateway.DIGIPAY
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedGateway(PaymentGateway.DIGIPAY)}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <input
              type="radio"
              checked={selectedGateway === PaymentGateway.DIGIPAY}
              onChange={() => setSelectedGateway(PaymentGateway.DIGIPAY)}
              className="w-4 h-4"
            />
            <span className="font-medium">دیجی پی</span>
            <span className="text-sm text-gray-500">(درگاه اینترنتی)</span>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer border-2 transition-all ${
            selectedGateway === PaymentGateway.TARA
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedGateway(PaymentGateway.TARA)}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <input
              type="radio"
              checked={selectedGateway === PaymentGateway.TARA}
              onChange={() => setSelectedGateway(PaymentGateway.TARA)}
              className="w-4 h-4"
            />
            <span className="font-medium">تارا</span>
            <span className="text-sm text-gray-500">(درگاه اینترنتی)</span>
          </CardContent>
        </Card>

        {snappayAvailable && (
          <Card
            className={`cursor-pointer border-2 transition-all ${
              selectedGateway === PaymentGateway.SNAPPAY
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedGateway(PaymentGateway.SNAPPAY)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <input
                type="radio"
                checked={selectedGateway === PaymentGateway.SNAPPAY}
                onChange={() => setSelectedGateway(PaymentGateway.SNAPPAY)}
                className="w-4 h-4 shrink-0"
              />
              <div className="flex flex-col">
                <span className="font-medium">
                  {snappayEligibility?.title_message}
                </span>
                <span className="text-sm text-gray-500">
                  {snappayEligibility?.description}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Button
        className="w-full mt-6"
        variant="dark"
        onClick={handlePayment}
        loading={isPending}
        disabled={!selectedGateway}
      >
        پرداخت
      </Button>
    </div>
  );
}
