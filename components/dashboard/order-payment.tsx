'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { OrderResponse, OrderStatus } from '@/services/features/orders/type';
import {
  useSnappayEligibility,
  useStartPayment,
} from '@/services/features/payment/hooks';
import { PaymentGateway } from '@/services/features/payment/type';

/** درگاه‌های اینترنتی قابل انتخاب برای پرداخت سفارش در داشبورد */
const ONLINE_GATEWAYS: {
  gateway: PaymentGateway;
  title: string;
  description: string;
}[] = [
  {
    gateway: PaymentGateway.ZARINPAL,
    title: 'زرین‌پال',
    description: 'درگاه اینترنتی',
  },
  {
    gateway: PaymentGateway.DIGIPAY,
    title: 'دیجی پی',
    description: 'درگاه اینترنتی',
  },
  {
    gateway: PaymentGateway.TARA,
    title: 'تارا',
    description: 'درگاه اینترنتی',
  },
];

/**
 * مبلغی که باید با درگاه پرداخت شود (تومان).
 * بخشی از مبلغ سفارش ممکن است قبلاً از کیف پول کسر شده باشد.
 */
export function getOrderCardAmount(order: OrderResponse): number {
  return Math.max(
    0,
    Number(order.finalPrice ?? 0) - Number(order.walletPayment ?? 0),
  );
}

/**
 * آیا این سفارش در داشبورد امکان پرداخت با درگاه دارد؟
 * فقط سفارش در انتظار پرداخت که کل مبلغش با کیف پول پوشش داده نشده باشد.
 */
export function canPayOrderOnline(order: OrderResponse): boolean {
  return order.status === OrderStatus.PENDING && getOrderCardAmount(order) > 0;
}

interface OrderPaymentProps {
  order: OrderResponse;
}

/**
 * انتخاب درگاه و پرداخت یک سفارش در انتظار پرداخت از داشبورد.
 *
 * پنل فقط با باز شدن دکمه «پرداخت سفارش» داده‌های اسنپ‌پی را استعلام
 * می‌کند. مبلغ و مالکیت سفارش در سرور بررسی می‌شود.
 */
export default function OrderPayment({ order }: OrderPaymentProps) {
  const [open, setOpen] = useState(false);
  const [selectedGatewayState, setSelectedGateway] =
    useState<PaymentGateway | null>(null);

  const startPayment = useStartPayment();

  const cardAmount = getOrderCardAmount(order);
  const walletAmount = Number(order.walletPayment ?? 0);

  // اسنپ‌پی فقط وقتی پنل باز است و با همین سفارش استعلام می‌شود
  const { data: snappayEligibilityData } = useSnappayEligibility(
    { orderId: order.id },
    open,
  );

  const snappayEligibility = snappayEligibilityData?.data;

  const snappayAvailable = Boolean(
    snappayEligibility?.eligible && snappayEligibility?.title_message,
  );

  // اگر اسنپ‌پی دیگر مجاز نباشد، انتخاب قبلی آن بی‌اثر می‌شود
  const selectedGateway =
    selectedGatewayState === PaymentGateway.SNAPPAY && !snappayAvailable
      ? null
      : selectedGatewayState;

  const handlePay = () => {
    if (!selectedGateway) {
      toast.error('لطفاً یک درگاه پرداخت انتخاب کنید');

      return;
    }

    startPayment.mutate(
      { orderId: order.id, gateway: selectedGateway },
      {
        onSuccess: response => {
          const payUrl = response.data?.payUrl;

          if (!payUrl) {
            toast.error('آدرس پرداخت دریافت نشد');

            return;
          }

          window.location.href = payUrl;
        },
      },
    );
  };

  if (!open) {
    return (
      <Button size="sm" variant="dark" onClick={() => setOpen(true)}>
        پرداخت سفارش
      </Button>
    );
  }

  return (
    <div className="w-full space-y-3 rounded-lg border bg-gray-50 p-4">
      <div className="space-y-1 text-sm">
        <p className="font-medium">
          مبلغ قابل پرداخت با درگاه: {formatPrice(cardAmount)} تومان
        </p>

        {walletAmount > 0 && (
          <p className="text-xs text-gray-500">
            مبلغ {formatPrice(walletAmount)} تومان از کیف پول کسر شده و
            باقی‌مانده با درگاه پرداخت می‌شود.
          </p>
        )}
      </div>

      <p className="text-sm text-gray-600">درگاه پرداخت را انتخاب کنید:</p>

      <div className="space-y-2">
        {ONLINE_GATEWAYS.map(option => {
          const selected = selectedGateway === option.gateway;

          return (
            <label
              key={option.gateway}
              className={`flex cursor-pointer items-center gap-3 rounded-md border-2 p-3 transition-all ${
                selected
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={`gateway-${order.id}`}
                checked={selected}
                onChange={() => setSelectedGateway(option.gateway)}
                className="h-4 w-4"
              />

              <div>
                <div className="font-medium">{option.title}</div>

                <div className="text-xs text-gray-500">
                  {option.description}
                </div>
              </div>
            </label>
          );
        })}

        {snappayAvailable && (
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-md border-2 p-3 transition-all ${
              selectedGateway === PaymentGateway.SNAPPAY
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name={`gateway-${order.id}`}
              checked={selectedGateway === PaymentGateway.SNAPPAY}
              onChange={() => setSelectedGateway(PaymentGateway.SNAPPAY)}
              className="h-4 w-4"
            />

            <div>
              <div className="font-medium">
                {snappayEligibility?.title_message}
              </div>

              <div className="text-xs text-gray-500">
                {snappayEligibility?.description}
              </div>
            </div>
          </label>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
          disabled={startPayment.isPending}
        >
          انصراف
        </Button>

        <Button
          size="sm"
          variant="dark"
          onClick={handlePay}
          loading={startPayment.isPending}
          disabled={!selectedGateway}
        >
          پرداخت
        </Button>
      </div>
    </div>
  );
}
