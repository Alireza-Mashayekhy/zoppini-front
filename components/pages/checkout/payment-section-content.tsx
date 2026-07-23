'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useStartPayment } from '@/services/features/payment/hooks';
import { PaymentGateway } from '@/services/features/payment/type';

export default function PaymentSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(
    null,
  );
  const { mutate, isPending } = useStartPayment();

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
      { orderId: Number(orderId), gateway: selectedGateway },
      {
        onSuccess: data => {
          // ارسال فرم POST به درگاه
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = data.payUrl;
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'RefId';
          input.value = data.refId;
          form.appendChild(input);
          document.body.appendChild(form);
          form.submit();
        },
        onError: (error: any) => {
          toast.error(error?.message || 'خطا در شروع پرداخت');
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
        <Card
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
        </Card>
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
