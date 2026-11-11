'use client';

import { AlertTriangle, Loader2, PlayCircle, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePreviewPromotion } from '@/services/features/promotions/hooks';
import { PreviewPromotionResponse } from '@/services/features/promotions/types';

import { formatNumber, formatPrice } from './utils';

interface PreviewPanelProps {
  promotionId: number;
  defaultQuantity?: number;
  defaultCartValue?: number;
}

/**
 * پیش‌نمایش زندهٔ پروموشن با سبد نمونه.
 *
 * مدیر می‌تواند تعداد کالا و مبلغ سبد را تغییر دهد و ببیند موتور چه تصمیمی
 * می‌گیرد، چه چیزی رد می‌شود و چرا — پیش از آن‌که مشتری واقعی تحت تأثیر
 * قرار بگیرد.
 */
export default function PreviewPanel({
  promotionId,
  defaultQuantity = 2,
  defaultCartValue = 0,
}: PreviewPanelProps) {
  const preview = usePreviewPromotion();

  const [quantity, setQuantity] = useState(defaultQuantity);
  const [cartValue, setCartValue] = useState(defaultCartValue);

  const result: PreviewPromotionResponse | undefined = preview.data?.data;

  const run = () => {
    preview.mutate({
      id: promotionId,
      quantity,
      cartValue: cartValue || undefined,
    });
  };

  return (
    <div className="space-y-3 rounded-xl border bg-white p-4">
      <header>
        <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <PlayCircle className="size-4" />
          پیش‌نمایش با سبد نمونه
        </h3>

        <p className="mt-1 text-xs text-muted-foreground">
          تعداد کالا و مبلغ سبد را تغییر دهید تا نتیجهٔ موتور را ببینید.
        </p>
      </header>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-[11px]">تعداد کالا در سبد</Label>

          <Input
            type="number"
            min={0}
            value={quantity}
            onChange={event => setQuantity(Number(event.target.value))}
            className="h-8"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[11px]">مبلغ سبد (تومان)</Label>

          <Input
            type="number"
            min={0}
            value={cartValue}
            onChange={event => setCartValue(Number(event.target.value))}
            className="h-8"
          />
        </div>

        <div className="flex items-end">
          <Button
            type="button"
            variant="dark"
            className="h-8 w-full"
            onClick={run}
            disabled={preview.isPending}
          >
            {preview.isPending ? (
              <Loader2 className="ml-2 size-3.5 animate-spin" />
            ) : (
              <ShoppingCart className="ml-2 size-3.5" />
            )}
            اجرای پیش‌نمایش
          </Button>
        </div>
      </div>

      {preview.isError && (
        <p className="text-xs text-red-600">
          پیش‌نمایش انجام نشد. تنظیمات پروموشن را ذخیره کنید و دوباره تلاش کنید.
        </p>
      )}

      {result && (
        <div className="space-y-3 border-t pt-3">
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span
              className={
                result.applied.length
                  ? 'bg-green-50 px-2 py-1 font-medium text-green-700'
                  : 'bg-amber-50 px-2 py-1 font-medium text-amber-700'
              }
            >
              {result.applied.length
                ? 'اعمال می‌شود'
                : 'در این سبد اعمال نمی‌شود'}
            </span>

            <span className="bg-muted px-2 py-1">وضعیت: {result.state}</span>

            <span className="bg-muted px-2 py-1">
              {result.sampleCart.itemCount.toLocaleString('fa-IR')} کالا /{' '}
              {formatPrice(result.sampleCart.cartValue)}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="border p-2">
              <p className="text-[11px] text-muted-foreground">تخفیف پروموشن</p>

              <p className="text-sm font-bold">
                {formatPrice(result.totals.promotionDiscount)}
              </p>
            </div>

            <div className="border p-2">
              <p className="text-[11px] text-muted-foreground">ارزش کالای رایگان</p>

              <p className="text-sm font-bold">
                {formatPrice(result.totals.freeItemValue)}
              </p>
            </div>

            <div className="border p-2">
              <p className="text-[11px] text-muted-foreground">مبلغ نهایی سبد</p>

              <p className="text-sm font-bold">
                {formatPrice(result.totals.finalPrice)}
              </p>
            </div>

            <div className="border p-2">
              <p className="text-[11px] text-muted-foreground">ارسال رایگان</p>

              <p className="text-sm font-bold">
                {result.totals.freeShipping ? 'بله' : 'خیر'}
              </p>
            </div>
          </div>

          {(result.evaluation?.message ||
            !!result.evaluation?.reasons?.length) && (
            <div className="space-y-1 text-[11px] leading-5 text-muted-foreground">
              {result.evaluation?.message && (
                <p>پیام به مشتری: {result.evaluation.message}</p>
              )}

              {result.evaluation?.reasons?.map(reason => (
                <p key={reason}>• {reason}</p>
              ))}
            </div>
          )}

          {!!result.rejected.length && (
            <div className="space-y-1 border-t pt-2">
              <p className="text-[11px] font-semibold text-amber-700">
                رد شده ({formatNumber(result.rejected.length)})
              </p>

              {result.rejected.map(item => (
                <p
                  key={item.promotionId}
                  className="text-[11px] leading-5 text-muted-foreground"
                >
                  {item.name}:{' '}
                  {item.message ||
                    item.reasons?.join('، ') ||
                    'شرایط احراز نشد'}
                </p>
              ))}
            </div>
          )}

          {!!result.warnings.length && (
            <ul className="space-y-1 border-t pt-2">
              {result.warnings.map(warning => (
                <li
                  key={warning}
                  className="flex items-start gap-1 text-[11px] leading-5 text-amber-700"
                >
                  <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                  {warning}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
