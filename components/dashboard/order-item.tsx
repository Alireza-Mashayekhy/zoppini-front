// components/dashboard/order-item.tsx
'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import CancelOrderDialog from '@/components/dashboard/cancel-order-dialog';
import OrderPayment, { canPayOrderOnline } from '@/components/dashboard/order-payment';
import OrderStatusBadge from '@/components/dashboard/order-status-badge';
import { Button } from '@/components/ui/button';
import {
  canCancelOrder,
  getOrderStatusMeta,
  needsWalletConfirmation,
} from '@/lib/order-status';
import { cn, formatPrice, toPersianDate } from '@/lib/utils';
import { useConfirmOrderFromWallet } from '@/services/features/orders/hooks';
import {
  OrderResponse,
  ShippingMethod,
} from '@/services/features/orders/type';

interface OrderItemProps {
  order: OrderResponse;
  /** باز بودنِ بخش جزئیات (از صفحه کنترل می‌شود تا لینکِ مستقیم ممکن باشد) */
  expanded: boolean;
  onToggle: () => void;
}

/**
 * یک ردیفِ سفارش در صفحه‌ی «سفارشات من».
 *
 * قواعدِ اقدام‌ها از `lib/order-status.ts` می‌آید تا با سرور یکی باشد:
 * پرداخت فقط برای سفارشِ در انتظار پرداختی که مبلغی از آن با اعتبارها پوشش
 * داده نشده باشد، و لغو فقط برای سفارشِ در انتظار پرداخت (سرور سفارشِ
 * پرداخت‌شده را نمی‌پذیرد). لغو همیشه با دیالوگِ تأیید انجام می‌شود.
 */
export default function OrderItem({
  order,
  expanded,
  onToggle,
}: OrderItemProps) {
  const [cancelOpen, setCancelOpen] = useState(false);

  const confirmFromWallet = useConfirmOrderFromWallet();

  const status = getOrderStatusMeta(order.status);

  const canCancel = canCancelOrder(order);
  const canPay = canPayOrderOnline(order);
  const walletRetry = needsWalletConfirmation(order);

  const walletPaymentAmount = Number(order.walletPayment ?? 0);
  const clubCreditAmount = Number(order.clubCreditPayment ?? 0);

  const panelId = `order-details-${order.id}`;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-white transition-shadow',
        expanded ? 'shadow-md' : 'shadow-sm hover:shadow-md',
      )}
    >
      {/* هدر سفارش */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="flex w-full flex-col gap-3 p-4 text-start transition-colors hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-[#1A1A1A] focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs text-gray-500">شماره سفارش</span>
          <span
            dir="ltr"
            className="max-w-full break-all font-mono text-sm font-medium"
          >
            {order.orderNumber}
          </span>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">
            {toPersianDate(order.createdAt)}
          </span>
          <span className="font-semibold whitespace-nowrap">
            {formatPrice(order.finalPrice)} تومان
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500">
            {expanded ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </span>
        </div>
      </button>

      {/* جزئیات سفارش (expandable) */}
      {expanded && (
        <div id={panelId} className="space-y-4 border-t border-border p-4">
          {/* وضعیت و گام بعدی */}
          <div className="rounded-md bg-neutral-50 p-3 text-xs leading-6 text-gray-600">
            <p className="font-medium text-gray-800">{status.label}</p>
            <p>{status.description}</p>
            {status.nextAction && (
              <p className="text-gray-700">{status.nextAction}</p>
            )}
          </div>

          {/* اقلام سفارش */}
          <div className="space-y-2">
            {order.items.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 border-b border-border py-2 last:border-0"
              >
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                  <Image
                    src={
                      process.env.NEXT_PUBLIC_IMAGE_URL +
                      (item.variant.product.image || 'placeholder.jpg')
                    }
                    alt={item.variant.product.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {item.variant.product.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.variant.color?.name} / {item.variant.size?.name}
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-sm font-semibold whitespace-nowrap">
                    {formatPrice(item.price * item.quantity)} تومان
                  </p>
                  <p className="text-xs text-gray-500">
                    تعداد: {item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* اطلاعات ارسال و مبالغ */}
          <div className="flex flex-wrap justify-between gap-4 border-t border-border pt-2">
            <div className="space-y-1 text-sm">
              {order.shippingMethod === ShippingMethod.PICKUP ? (
                <p>روش تحویل: تحویل حضوری در هدیش مال</p>
              ) : (
                <p className="break-words">
                  آدرس: {order.shippingAddress || 'ثبت نشده'}
                </p>
              )}
              <p>تلفن: {order.phone || 'ثبت نشده'}</p>
              {order.note && <p>توضیحات: {order.note}</p>}
            </div>

            <div className="space-y-1 text-sm">
              <p>جمع سفارش: {formatPrice(order.totalPrice)} تومان</p>
              <p>هزینه ارسال: {formatPrice(order.shippingCost)} تومان</p>
              {order.discount > 0 && (
                <p>تخفیف: {formatPrice(order.discount)} تومان</p>
              )}
              {!!order.promotionDiscount && (
                <p>
                  تخفیف پیشنهاد ویژه:{' '}
                  {formatPrice(order.promotionDiscount)} تومان
                </p>
              )}
              {!!order.promotionFreeItemValue && (
                <p>
                  کالای رایگان:{' '}
                  {formatPrice(order.promotionFreeItemValue)} تومان
                </p>
              )}
              {!!order.promotionFreeShipping && (
                <p>ارسال رایگان (پیشنهاد ویژه)</p>
              )}
              {walletPaymentAmount > 0 && (
                <p>
                  پرداخت از کیف پول: {formatPrice(walletPaymentAmount)} تومان
                </p>
              )}
              {clubCreditAmount > 0 && (
                <p>
                  پرداخت از اعتبار باشگاه: {formatPrice(clubCreditAmount)}{' '}
                  تومان
                </p>
              )}
              <p className="text-base font-semibold">
                قابل پرداخت: {formatPrice(order.finalPrice)} تومان
              </p>
            </div>
          </div>

          {/* اقدام‌ها — فقط آن‌هایی که سرور می‌پذیرد */}
          {(walletRetry || canPay || canCancel) && (
            <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-end">
              {walletRetry && (
                <p className="text-xs text-gray-500 sm:me-auto">
                  این سفارش با اعتبارهای شما (کیف پول یا باشگاه) پوشش داده شده؛
                  تأیید آن را دوباره امتحان کنید.
                </p>
              )}

              {walletRetry && (
                <Button
                  size="sm"
                  variant="dark"
                  className="h-9 px-4 text-sm sm:h-8"
                  onClick={() => confirmFromWallet.mutate(order.id)}
                  loading={confirmFromWallet.isPending}
                  disabled={confirmFromWallet.isPending}
                >
                  تأیید مجدد با کیف پول
                </Button>
              )}

              {canPay && <OrderPayment order={order} />}

              {canCancel && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-9 px-4 text-sm sm:h-8"
                  onClick={() => setCancelOpen(true)}
                >
                  لغو سفارش
                </Button>
              )}
            </div>
          )}

          {canCancel && (
            <CancelOrderDialog
              order={order}
              open={cancelOpen}
              onOpenChange={setCancelOpen}
            />
          )}

          {!canPay && !canCancel && !walletRetry && (
            <p className="border-t border-border pt-3 text-xs text-gray-500">
              {status.status === 'delivered'
                ? 'این سفارش تکمیل شده است. برای پرسش درباره‌ی آن با پشتیبانی تماس بگیرید.'
                : 'اقدامی برای این سفارش لازم نیست.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
