'use client';

import { RefreshCcw, Ticket } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, toPersianDate } from '@/lib/utils';
import { useClubMe } from '@/services/features/club/hooks';
import { ClubCoupon, rialToToman } from '@/services/features/club/type';

const isExpired = (coupon: ClubCoupon) => {
  if (coupon.ExpireTypeIndex !== 1 || !coupon.ExpireDate) return false;

  return new Date(coupon.ExpireDate).getTime() < Date.now();
};

const discountLabel = (coupon: ClubCoupon) =>
  coupon.DiscountTypeIndex === 1
    ? `${formatPrice(coupon.DiscountValue)}٪ تخفیف`
    : `${formatPrice(rialToToman(coupon.DiscountValue))} تومان تخفیف`;

/**
 * بن‌های تخفیف (کوپن‌های) کاربر در باشگاه مشتریان
 */
export default function ClubCoupons() {
  const { data, isLoading, isError, refetch, isFetching } = useClubMe();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-white p-10 text-center">
        <Ticket className="h-10 w-10 text-gray-300" strokeWidth={1} />
        <p className="text-sm text-gray-500">اطلاعات بن‌ها دریافت نشد</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          loading={isFetching}
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          تلاش مجدد
        </Button>
      </div>
    );
  }

  const coupons = data.data.Coupons ?? [];

  if (coupons.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white p-10 text-center">
        <Ticket className="mx-auto h-10 w-10 text-gray-300" strokeWidth={1} />
        <p className="mt-3 text-sm text-gray-500">
          در حال حاضر بن تخفیفی ندارید
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {coupons.map((coupon: ClubCoupon) => {
        const expired = isExpired(coupon);
        const used = coupon.IsUsed;
        const disabled = !coupon.IsActive || expired || used;

        return (
          <div
            key={coupon.Id}
            className={
              disabled
                ? 'rounded-lg border border-border bg-gray-50 p-4 opacity-60'
                : 'rounded-lg border border-border bg-white p-4'
            }
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                  <Ticket className="h-4.5 w-4.5 text-gray-700" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium">{coupon.Title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {discountLabel(coupon)}
                  </p>
                </div>
              </div>

              {used ? (
                <Badge variant="secondary">استفاده شده</Badge>
              ) : expired ? (
                <Badge variant="secondary">منقضی</Badge>
              ) : coupon.IsActive ? (
                <Badge>فعال</Badge>
              ) : (
                <Badge variant="secondary">غیرفعال</Badge>
              )}
            </div>

            <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span>کد بن</span>
                <span className="font-medium tracking-wider text-gray-800">
                  {coupon.Code}
                </span>
              </div>

              {coupon.ExpireTypeIndex === 1 && coupon.ExpireDate && (
                <div className="flex items-center justify-between">
                  <span>تاریخ انقضا</span>
                  <span>{toPersianDate(coupon.ExpireDate)}</span>
                </div>
              )}

              {coupon.ExpireTypeIndex === 2 &&
                coupon.ExpireDaysAfterAssignment != null && (
                  <div className="flex items-center justify-between">
                    <span>اعتبار</span>
                    <span>
                      {formatPrice(coupon.ExpireDaysAfterAssignment)} روز پس از
                      تخصیص
                    </span>
                  </div>
                )}

              {coupon.MinimumOrderPrice != null && coupon.MinimumOrderPrice > 0 && (
                <div className="flex items-center justify-between">
                  <span>حداقل مبلغ خرید</span>
                  <span>
                    {formatPrice(rialToToman(coupon.MinimumOrderPrice))} تومان
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
