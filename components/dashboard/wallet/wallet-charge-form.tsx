'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/lib/utils';
import { PaymentGateway } from '@/services/features/payment/type';
import { useStartWalletCharge } from '@/services/features/wallet/hooks';

const MIN_CHARGE_AMOUNT = 1000;

const QUICK_AMOUNTS = [50000, 100000, 500000, 1000000];

const GATEWAYS: {
  value: PaymentGateway;
  title: string;
  description: string;
}[] = [
  // {
  //   value: PaymentGateway.MELLAT,
  //   title: 'بانک ملت',
  //   description: 'درگاه شتاب',
  // },
  {
    value: PaymentGateway.ZARINPAL,
    title: 'زرین‌پال',
    description: 'درگاه اینترنتی',
  },
  {
    value: PaymentGateway.DIGIPAY,
    title: 'دیجی‌پی',
    description: 'درگاه اینترنتی',
  },
  {
    value: PaymentGateway.TARA,
    title: 'تارا',
    description: 'درگاه اینترنتی',
  },
];

/**
 * فرم شارژ کیف پول از طریق درگاه بانکی
 */
export default function WalletChargeForm() {
  const [amount, setAmount] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(
    null,
  );

  const charge = useStartWalletCharge();

  const amountNumber = Number(amount) || 0;

  const handleAmountChange = (value: string) => {
    // فقط ارقام را نگه می‌داریم
    setAmount(value.replace(/\D/g, ''));
  };

  const handleCharge = () => {
    if (amountNumber < MIN_CHARGE_AMOUNT) {
      toast.error('حداقل مبلغ شارژ ۱,۰۰۰ تومان است');
      return;
    }

    if (!selectedGateway) {
      toast.error('لطفاً یک درگاه پرداخت انتخاب کنید');
      return;
    }

    charge.mutate(
      { amount: amountNumber, gateway: selectedGateway },
      {
        onSuccess: response => {
          const payment = response.data;

          if (!payment?.payUrl) {
            toast.error('آدرس پرداخت دریافت نشد');
            return;
          }

          /**
           * هدایت به درگاه — پس از verify موفق،
           * مبلغ به‌صورت خودکار به کیف پول واریز می‌شود
           */
          window.location.href = payment.payUrl;
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              'خطا در شروع شارژ کیف پول',
          );
        },
      },
    );
  };

  return (
    <div className="rounded-lg border border-border bg-white p-6">
      <h2 className="text-xl font-light tracking-wide">شارژ کیف پول</h2>
      <p className="mt-1 text-sm text-gray-500">
        مبلغ مورد نظر را وارد کنید و از طریق کارت بانکی پرداخت کنید.
      </p>

      <div className="mt-5 space-y-5">
        {/* مبلغ */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            مبلغ شارژ (تومان)
          </label>

          <Input
            value={amount}
            onChange={e => handleAmountChange(e.target.value)}
            inputMode="numeric"
            placeholder="مثلاً ۵۰۰,۰۰۰"
            dir="ltr"
            className="text-left"
          />

          {amountNumber > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              {formatPrice(amountNumber)} تومان
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map(value => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(String(value))}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  Number(amount) === value
                    ? 'border-gray-800 bg-gray-800 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {formatPrice(value)}
              </button>
            ))}
          </div>
        </div>

        {/* درگاه */}
        <div>
          <label className="mb-2 block text-sm font-medium">درگاه پرداخت</label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {GATEWAYS.map(gateway => (
              <GatewayOption
                key={gateway.value}
                title={gateway.title}
                description={gateway.description}
                selected={selectedGateway === gateway.value}
                onSelect={() => setSelectedGateway(gateway.value)}
              />
            ))}
          </div>
        </div>

        <Button
          className="w-full"
          variant="dark"
          onClick={handleCharge}
          loading={charge.isPending}
        >
          ادامه و پرداخت
        </Button>
      </div>
    </div>
  );
}

/* ========================================= */
/* گزینه درگاه */
/* ========================================= */

interface GatewayOptionProps {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

function GatewayOption({
  title,
  description,
  selected,
  onSelect,
}: GatewayOptionProps) {
  return (
    <Card
      className={`cursor-pointer border-2 transition-all ${
        selected
          ? 'border-gray-800 bg-gray-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <CardContent className="flex items-center gap-3 p-3">
        <input
          type="radio"
          checked={selected}
          onChange={onSelect}
          className="h-4 w-4"
        />

        <div>
          <div className="text-sm font-medium">{title}</div>

          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </CardContent>
    </Card>
  );
}
