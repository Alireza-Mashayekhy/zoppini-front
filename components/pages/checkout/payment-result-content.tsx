'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';

export default function PaymentResultContent() {
  const searchParams = useSearchParams();

  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');

  const isSuccess = status === 'success';

  return (
    <div className="container mx-auto max-w-md px-4 py-20 text-center">
      {isSuccess ? (
        <>
          <CheckCircle className="mx-auto mb-4 h-20 w-20 text-green-500" />

          <h1 className="text-2xl font-bold text-green-600">پرداخت موفق</h1>

          <p className="mt-2 text-gray-500">
            سفارش شما با موفقیت ثبت و پرداخت شد.
          </p>

          {orderId && (
            <p className="mt-1 text-sm text-gray-400">شماره سفارش: {orderId}</p>
          )}

          <Link href={`/dashboard/orders`}>
            <Button variant="dark" className="mt-6">
              مشاهده سفارشات
            </Button>
          </Link>
        </>
      ) : (
        <>
          <XCircle className="mx-auto mb-4 h-20 w-20 text-red-500" />

          <h1 className="text-2xl font-bold text-red-600">پرداخت ناموفق</h1>

          <p className="mt-2 text-gray-500">
            متأسفانه پرداخت شما با خطا مواجه شد.
          </p>

          <p className="mt-1 text-sm text-gray-400">
            لطفاً مجدداً تلاش کنید یا با پشتیبانی تماس بگیرید.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {orderId && (
              <Link href={`/checkout/payment?orderId=${orderId}`}>
                <Button variant="outline">تلاش مجدد</Button>
              </Link>
            )}

            <Link href="/dashboard/orders">
              <Button variant="dark">مشاهده سفارشات</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
