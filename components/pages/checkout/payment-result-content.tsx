'use client';

import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';

export default function PaymentResultContent() {
  const searchParams = useSearchParams();

  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');

  if (!status) {
    return (
      <div className="container mx-auto max-w-md px-4 py-20 text-center">
        <AlertCircle className="mx-auto mb-4 h-20 w-20 text-yellow-500" />

        <h1 className="text-2xl font-bold">اطلاعات پرداخت پیدا نشد</h1>

        <p className="mt-3 text-gray-500">
          لطفاً از طریق سفارشات وضعیت پرداخت را بررسی کنید.
        </p>

        <Link href="/dashboard/orders">
          <Button className="mt-6" variant="dark">
            مشاهده سفارشات
          </Button>
        </Link>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="container mx-auto max-w-md px-4 py-20 text-center">
        <Loader2 className="mx-auto mb-4 h-20 w-20 animate-spin text-blue-500" />

        <h1 className="text-2xl font-bold">در حال بررسی پرداخت</h1>

        <p className="mt-3 text-gray-500">لطفاً چند لحظه صبر کنید...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="container mx-auto max-w-md px-4 py-20 text-center">
        <CheckCircle className="mx-auto mb-5 h-20 w-20 text-green-500" />

        <h1 className="text-3xl font-bold text-green-600">پرداخت موفق بود</h1>

        <p className="mt-3 text-gray-500">سفارش شما با موفقیت ثبت شد.</p>

        {orderId && (
          <p className="mt-2 text-sm text-gray-400">شماره سفارش: {orderId}</p>
        )}

        <div className="mt-8">
          <Link href="/dashboard/orders">
            <Button variant="dark">مشاهده سفارشات</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-20 text-center">
      <XCircle className="mx-auto mb-5 h-20 w-20 text-red-500" />

      <h1 className="text-3xl font-bold text-red-600">پرداخت ناموفق بود</h1>

      <p className="mt-3 text-gray-500">
        پرداخت انجام نشد یا توسط کاربر لغو شد.
      </p>

      <div className="mt-8 flex justify-center gap-3">
        {orderId && (
          <Link href={`/checkout/payment?orderId=${orderId}`}>
            <Button variant="outline">تلاش مجدد</Button>
          </Link>
        )}

        <Link href="/dashboard/orders">
          <Button variant="dark">سفارشات</Button>
        </Link>
      </div>
    </div>
  );
}
