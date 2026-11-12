'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FirstPurchaseGiftAdminSettings,
  UpdateFirstPurchaseGift,
} from '@/services/features/first-purchase-gift/api';
import {
  useAdminFirstPurchaseGift,
  useUpdateFirstPurchaseGift,
} from '@/services/features/first-purchase-gift/hooks';

function toLocalInput(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export default function FirstPurchaseGiftSettingsPanel() {
  const { data, isLoading, refetch, isFetching } = useAdminFirstPurchaseGift();
  const update = useUpdateFirstPurchaseGift();
  const settings = data?.data;
  const [formOverride, setFormOverride] =
    useState<FirstPurchaseGiftAdminSettings | null>(null);
  const form = formOverride ?? settings ?? null;

  const patch = (values: Partial<FirstPurchaseGiftAdminSettings>) =>
    setFormOverride(current => ({ ...(current ?? form!), ...values }));

  const save = () => {
    if (!form) return;
    const payload: UpdateFirstPurchaseGift = {
      isActive: form.isActive,
      discountPercent: Number(form.discountPercent),
      title: form.title.trim(),
      description: form.description.trim(),
      startsAt: toIso(form.startsAt ? toLocalInput(form.startsAt) : '') ,
      endsAt: toIso(form.endsAt ? toLocalInput(form.endsAt) : ''),
      popupEnabled: form.popupEnabled,
      announcementEnabled: form.announcementEnabled,
      popupFrequency: form.popupFrequency,
      stackWithDiscountCodes: form.stackWithDiscountCodes,
      stackWithSalePrices: form.stackWithSalePrices,
    };
    update.mutate(payload, {
      onSuccess: () => toast.success('تنظیمات هدیهٔ اولین خرید ذخیره شد.'),
      onError: (error: any) =>
        toast.error(
          error?.response?.data?.message ?? 'ذخیرهٔ تنظیمات انجام نشد.',
        ),
    });
  };

  if (isLoading || !form) {
    return (
      <div className="rounded-xl border bg-white p-10 text-center text-sm text-muted-foreground">
        در حال دریافت تنظیمات هدیهٔ اولین خرید…
      </div>
    );
  }

  const metrics = [
    ['واجد شرایط', form.analytics.eligibleCustomers.toLocaleString('fa-IR')],
    ['مشتریان استفاده‌کننده', form.analytics.usedCustomers.toLocaleString('fa-IR')],
    ['سفارش‌های منتسب', form.analytics.ordersGenerated.toLocaleString('fa-IR')],
    ['مجموع تخفیف', `${form.analytics.totalDiscountValue.toLocaleString('fa-IR')} تومان`],
    ['درآمد سفارش‌ها', `${form.analytics.revenueGenerated.toLocaleString('fa-IR')} تومان`],
  ];

  const toggle = (
    key:
      | 'isActive'
      | 'popupEnabled'
      | 'announcementEnabled'
      | 'stackWithDiscountCodes'
      | 'stackWithSalePrices',
    label: string,
    helper: string,
  ) => (
    <label className="flex items-start gap-3 rounded-lg border p-3">
      <input
        type="checkbox"
        checked={form[key]}
        onChange={event => patch({ [key]: event.target.checked })}
        className="mt-1 h-4 w-4 accent-rose-800"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
          {helper}
        </span>
      </span>
    </label>
  );

  return (
    <div className="space-y-5" dir="rtl">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-lg font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-5 rounded-xl border bg-white p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">هدیهٔ اولین خرید آنلاین</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              تخفیف اختصاصی حساب کاربری، با ثبت مصرف نهایی تنها پس از پرداخت موفق.
            </p>
          </div>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${form.currentlyActive ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>
            {form.currentlyActive ? 'فعال در حال حاضر' : 'غیرفعال در حال حاضر'}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            عنوان
            <Input value={form.title} maxLength={150} onChange={event => patch({ title: event.target.value })} />
          </label>
          <label className="space-y-2 text-sm font-medium">
            درصد تخفیف
            <Input type="number" min={1} max={100} step="0.5" value={form.discountPercent} onChange={event => patch({ discountPercent: Number(event.target.value) })} />
          </label>
          <label className="space-y-2 text-sm font-medium md:col-span-2">
            توضیحات
            <textarea
              value={form.description}
              maxLength={4000}
              rows={3}
              onChange={event => patch({ description: event.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            شروع اعتبار
            <Input
              type="datetime-local"
              value={toLocalInput(form.startsAt)}
              onChange={event => patch({ startsAt: event.target.value ? new Date(event.target.value).toISOString() : null })}
            />
            <span className="block text-xs font-normal text-muted-foreground">خالی بماند تا بدون تاریخ شروع فعال باشد.</span>
          </label>
          <label className="space-y-2 text-sm font-medium">
            پایان اعتبار
            <Input
              type="datetime-local"
              value={toLocalInput(form.endsAt)}
              onChange={event => patch({ endsAt: event.target.value ? new Date(event.target.value).toISOString() : null })}
            />
            <span className="block text-xs font-normal text-muted-foreground">خالی بماند تا بدون تاریخ پایان معتبر باشد.</span>
          </label>
          <label className="space-y-2 text-sm font-medium">
            تناوب نمایش popup
            <select
              value={form.popupFrequency}
              onChange={event => patch({ popupFrequency: event.target.value as FirstPurchaseGiftAdminSettings['popupFrequency'] })}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="session">یک‌بار در هر نشست</option>
              <option value="daily">حداکثر روزی یک‌بار</option>
              <option value="always">هر بار بازدید</option>
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2 md:col-span-2">
            {toggle('isActive', 'فعال‌سازی هدیه', 'اعمال هدیه در checkout و نمایش اجزای اطلاع‌رسانی را کنترل می‌کند.')}
            {toggle('popupEnabled', 'نمایش popup', 'مستقل از نوار اعلان قابل خاموش‌کردن است؛ مهمان‌ها CTA ورود/ثبت‌نام می‌بینند.')}
            {toggle('announcementEnabled', 'نمایش نوار اعلان', 'نوار متحرک بالای سایت؛ با تنظیم مستقل از popup.')}
            {toggle('stackWithDiscountCodes', 'امکان استفاده همزمان با کد تخفیف', 'در حالت خاموش، مشتری باید فقط هدیه یا فقط کد تخفیف را انتخاب کند.')}
            {toggle('stackWithSalePrices', 'اعمال هدیه روی کالاهای فروش ویژه', 'به‌صورت پیش‌فرض هدیه فقط به قیمت عادی اعمال می‌شود؛ این گزینه اجازهٔ stacking با فروش ویژه را می‌دهد.')}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>بازخوانی آمار</Button>
          <Button onClick={save} loading={update.isPending}>ذخیرهٔ تنظیمات</Button>
        </div>
      </section>
    </div>
  );
}
