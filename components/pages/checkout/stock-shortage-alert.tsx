'use client';

import { AlertTriangle, X } from 'lucide-react';

import {
  StockErrorInfo,
  stockItemAvailability,
  stockItemName,
} from '@/lib/stock-error';

interface StockShortageAlertProps {
  error: StockErrorInfo | null;
  onDismiss: () => void;
}

/**
 * Lists the cart items that ran short when the stock was re-checked against
 * Rahkaran before payment. The customer can change the quantity or remove the
 * item in the cart summary, then submit again.
 */
export default function StockShortageAlert({
  error,
  onDismiss,
}: StockShortageAlertProps) {
  if (!error || error.items.length === 0) return null;

  return (
    <div
      role="alert"
      dir="rtl"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
      data-testid="stock-shortage-alert"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="flex-1 space-y-2">
          <p className="font-medium">
            موجودی این کالاها تغییر کرده است. لطفاً تعداد را اصلاح یا کالا را از
            سبد حذف کنید و دوباره ثبت سفارش را بزنید.
          </p>
          <ul className="space-y-1">
            {error.items.map(item => (
              <li
                key={item.variantId}
                className="flex flex-wrap justify-between gap-x-3"
              >
                <span>{stockItemName(item)}</span>
                <span className="font-medium">
                  {stockItemAvailability(item)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 hover:bg-red-100"
          aria-label="بستن"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
