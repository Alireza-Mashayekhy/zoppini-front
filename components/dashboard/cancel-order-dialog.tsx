'use client';

import { AlertTriangle } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatPrice } from '@/lib/utils';
import { useCancelOrder } from '@/services/features/orders/hooks';
import { OrderResponse } from '@/services/features/orders/type';

interface CancelOrderDialogProps {
  order: OrderResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * تأییدِ لغو سفارش.
 *
 * چرا دیالوگِ جداگانه: لغو، عملی برگشت‌ناپذیر است و فقط برای سفارشِ «در انتظار
 * پرداخت» معتبر است. دکمه در زمانِ ارسال غیرفعال می‌شود تا درخواست تکراری
 * فرستاده نشود و وضعیتِ نهایی از سرور (نه از حالتِ محلی) گرفته می‌شود.
 */
export default function CancelOrderDialog({
  order,
  open,
  onOpenChange,
}: CancelOrderDialogProps) {
  const cancelOrder = useCancelOrder();

  /**
   * پیش‌فرضِ radix بسته شدنِ دیالوگ هنگام کلیک است؛ اینجا جلوی آن گرفته
   * می‌شود تا دکمه در زمانِ ارسال غیرفعال بماند (جلوگیری از ارسال تکراری) و
   * بسته شدن فقط بعد از پاسخِ سرور انجام شود — نه بر اساس حالتِ محلی.
   */
  const handleCancel = (event: React.MouseEvent) => {
    event.preventDefault();

    if (cancelOrder.isPending) return;

    cancelOrder.mutate(order.id, {
      onSuccess: () => onOpenChange(false),
      onError: () => onOpenChange(false),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm" className="gap-5">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle
              className="h-4 w-4 text-destructive"
              strokeWidth={1.5}
            />
            لغو سفارش
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-sm leading-6">
            <span className="block">
              آیا از لغو سفارش{' '}
              <span
                dir="ltr"
                className="inline-block font-mono break-all text-foreground"
              >
                {order.orderNumber}
              </span>{' '}
              مطمئن هستید؟
            </span>
            <span className="block">
              مبلغ {formatPrice(order.finalPrice)} تومان در صورت پرداخت با کیف
              پول یا اعتبار باشگاه، به حساب شما برمی‌گردد. این کار قابل
              بازگشت نیست.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={cancelOrder.isPending}>
            انصراف
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={cancelOrder.isPending}
            onClick={handleCancel}
          >
            {cancelOrder.isPending ? 'در حال لغو…' : 'لغو سفارش'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
