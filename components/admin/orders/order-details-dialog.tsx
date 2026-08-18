'use client';

import { Check, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminOrder, OrderStatus } from '@/services/features/orders/admin.api';
import {
  useAdminOrder,
  useUpdateAdminOrderStatus,
} from '@/services/features/orders/admin.hooks';

interface Props {
  order: AdminOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statuses = [
  {
    value: OrderStatus.PENDING,
    label: 'در انتظار',
  },
  {
    value: OrderStatus.PAID,
    label: 'پرداخت شده',
  },
  {
    value: OrderStatus.SHIPPED,
    label: 'ارسال شده',
  },
  {
    value: OrderStatus.DELIVERED,
    label: 'تحویل شده',
  },
  {
    value: OrderStatus.CANCELLED,
    label: 'لغو شده',
  },
];

const shippingMethods: Record<string, string> = {
  post: 'پست',
  courier: 'پیک',
  pickup: 'تحویل حضوری',
};

function formatPrice(value?: string | number | null) {
  if (value == null || value === '') {
    return '-';
  }

  const numericValue = typeof value === 'string' ? Number(value) : value;

  if (Number.isNaN(numericValue)) {
    return '-';
  }

  return `${new Intl.NumberFormat('fa-IR').format(numericValue)} تومان`;
}

function formatDate(value?: string) {
  if (!value) return '-';

  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
}: Props) {
  const { data, isLoading } = useAdminOrder(order?.id);

  const updateStatus = useUpdateAdminOrderStatus();

  const currentOrder = data?.data ?? order;

  const [status, setStatus] = useState<OrderStatus | undefined>(
    currentOrder?.status,
  );

  useEffect(() => {
    setStatus(currentOrder?.status);
  }, [currentOrder?.status]);

  if (!currentOrder) {
    return null;
  }

  const handleUpdateStatus = async () => {
    if (!status) return;

    try {
      updateStatus.mutateAsync({
        id: currentOrder.id,
        status,
      });

      toast.success('وضعیت سفارش با موفقیت به روز شد.');
    } catch (error) {
      toast.error('خطا در به روز رسانی وضعیت سفارش.');
      console.log(error);
    }
  };

  const shippingMethod =
    shippingMethods[currentOrder.shippingMethod ?? ''] ??
    currentOrder.shippingMethod ??
    '-';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>جزئیات سفارش {currentOrder.orderNumber}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* ================================================= */}
            {/* وضعیت سفارش */}
            {/* ================================================= */}

            <div className="rounded-xl border p-4">
              <div className="mb-3 text-sm font-medium">وضعیت سفارش</div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Select
                  value={status}
                  onValueChange={value => setStatus(value as OrderStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="انتخاب وضعیت" />
                  </SelectTrigger>

                  <SelectContent>
                    {statuses.map(item => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleUpdateStatus}
                  disabled={
                    updateStatus.isPending || status === currentOrder.status
                  }
                >
                  {updateStatus.isPending ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="ml-2 h-4 w-4" />
                  )}
                  ذخیره وضعیت
                </Button>
              </div>
            </div>

            {/* ================================================= */}
            {/* اطلاعات سفارش */}
            {/* ================================================= */}

            <div className="rounded-xl border p-4">
              <h3 className="mb-4 font-semibold">اطلاعات سفارش</h3>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Info label="شماره سفارش" value={currentOrder.orderNumber} />

                <Info
                  label="تاریخ ثبت"
                  value={formatDate(currentOrder.createdAt)}
                />

                <Info label="روش ارسال" value={shippingMethod} />

                <Info label="شماره تماس سفارش" value={currentOrder.phone} />

                <Info label="شناسه آدرس" value={currentOrder.addressId} />

                <Info label="یادداشت" value={currentOrder.note} />
              </div>
            </div>

            {/* ================================================= */}
            {/* مشتری */}
            {/* ================================================= */}

            <div className="rounded-xl border p-4">
              <h3 className="mb-4 font-semibold">اطلاعات مشتری</h3>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Info label="نام" value={currentOrder.user?.fullName} />

                <Info label="شماره تماس" value={currentOrder.user?.phone} />

                <Info label="ایمیل" value={currentOrder.user?.email} />
              </div>
            </div>

            {/* ================================================= */}
            {/* آدرس ارسال */}
            {/* ================================================= */}

            <div className="rounded-xl border p-4">
              <h3 className="mb-4 font-semibold">آدرس ارسال</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <Info
                  label="استان"
                  value={currentOrder?.address?.province?.name}
                />

                <Info label="شهر" value={currentOrder?.address?.city?.name} />

                <Info
                  label="کد پستی"
                  value={currentOrder?.address?.postalCode}
                />

                <Info label="آدرس" value={currentOrder?.address?.address} />
              </div>
            </div>

            {/* ================================================= */}
            {/* محصولات */}
            {/* ================================================= */}

            <div className="rounded-xl border">
              <div className="border-b p-4">
                <h3 className="font-semibold">محصولات سفارش</h3>
              </div>

              <div className="divide-y">
                {currentOrder.items?.length ? (
                  currentOrder.items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 p-4"
                    >
                      <div className="min-w-0">
                        <div className="font-medium">
                          {item.variant?.product?.title ?? 'محصول'}
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          تعداد: {item.quantity}
                        </div>

                        {item.variant?.sku && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            SKU: {item.variant.sku}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 text-left">
                        <div className="font-medium">
                          {formatPrice(item.price)}
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          {item.quantity} عدد
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground">
                          مجموع:{' '}
                          {formatPrice(Number(item.price) * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    محصولی برای این سفارش ثبت نشده است.
                  </div>
                )}
              </div>
            </div>

            {/* ================================================= */}
            {/* خلاصه مبلغ */}
            {/* ================================================= */}

            <div className="rounded-xl border p-4">
              <h3 className="mb-4 font-semibold">خلاصه مبلغ سفارش</h3>

              <div className="space-y-3">
                <PriceRow
                  label="مبلغ محصولات"
                  value={currentOrder.totalPrice}
                />

                <PriceRow
                  label="هزینه ارسال"
                  value={currentOrder.shippingCost}
                />

                <PriceRow
                  label="تخفیف"
                  value={currentOrder.discount}
                  negative
                />

                <div className="my-3 border-t" />

                <div className="flex items-center justify-between">
                  <span className="font-semibold">مبلغ نهایی</span>

                  <span className="text-lg font-bold">
                    {formatPrice(currentOrder.finalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* ================================================= */}
            {/* پرداخت */}
            {/* ================================================= */}

            {currentOrder.payment && (
              <div className="rounded-xl border p-4">
                <h3 className="mb-4 font-semibold">اطلاعات پرداخت</h3>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Info label="درگاه" value={currentOrder.payment.gateway} />

                  <Info
                    label="وضعیت پرداخت"
                    value={currentOrder.payment.status}
                  />

                  <Info
                    label="کد پیگیری"
                    value={currentOrder.payment.trackingCode}
                  />

                  <Info
                    label="مبلغ پرداخت"
                    value={
                      currentOrder.payment.amount
                        ? formatPrice(currentOrder.payment.amount)
                        : undefined
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>

      <div className="mt-1 break-words font-medium">
        {value !== null && value !== undefined && value !== '' ? value : '---'}
      </div>
    </div>
  );
}

function PriceRow({
  label,
  value,
  negative = false,
}: {
  label: string;
  value?: string | number | null;
  negative?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>

      <span className={negative ? 'font-medium' : 'font-medium'}>
        {negative && Number(value ?? 0) > 0 ? '- ' : ''}
        {formatPrice(value)}
      </span>
    </div>
  );
}
