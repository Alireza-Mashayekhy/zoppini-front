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
    <div className="container max-w-md mx-auto py-20 text-center px-4">
      {isSuccess ? (
        <>
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-600">پرداخت موفق</h1>
          <p className="text-gray-500 mt-2">
            سفارش شما با موفقیت ثبت و پرداخت شد.
          </p>
          {orderId && (
            <p className="text-sm text-gray-400 mt-1">شماره سفارش: {orderId}</p>
          )}
          <Link href={`/dashboard/orders/${orderId}`}>
            <Button variant="dark" className="mt-6">
              مشاهده سفارش
            </Button>
          </Link>
        </>
      ) : (
        <>
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600">پرداخت ناموفق</h1>
          <p className="text-gray-500 mt-2">
            متأسفانه پرداخت شما با خطا مواجه شد.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            لطفاً مجدداً تلاش کنید یا با پشتیبانی تماس بگیرید.
          </p>
          <div className="flex gap-2 justify-center mt-6 flex-wrap">
            <Link href={`/checkout/payment?orderId=${orderId}`}>
              <Button variant="outline">تلاش مجدد</Button>
            </Link>
            <Link href="/dashboard/orders">
              <Button variant="dark">مشاهده سفارشات</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
