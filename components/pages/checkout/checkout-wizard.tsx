// components/pages/checkout/checkout-wizard.tsx
'use client';

import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * پوستهٔ ویزارد سه‌مرحله‌ای تسویه (فقط موبایل؛ دسکتاپ همچنان چیدمان قبلی).
 *
 * - هر سه پنل همیشه mount می‌مانند و با کلاس `hidden` مخفی می‌شوند تا
 *   انتخاب‌های کاربر (آدرس، روش ارسال، کد تخفیف، درگاه، توضیحات) هنگام جابه‌جایی
 *   بین مراحل حفظ شود و react-hook-form مقادیرش را از دست ندهد.
 * - رفتن به مرحلهٔ بعد از طریق `validateStep` والد کنترل می‌شود؛ پرش به مرحله‌ای
 *   جلوتر از طریق شاخص مراحل هم ممکن نیست (فقط برگشت به مراحل قبلی آزاد است).
 * - دکمهٔ مرحلهٔ آخر `type="submit"` است و همان submit فرم موجود را صدا می‌زند؛
 *   هیچ منطق پرداخت جدیدی اینجا وجود ندارد.
 */

export const CHECKOUT_WIZARD_STEPS = [
  'سبد خرید',
  'اطلاعات ارسال',
  'پرداخت',
] as const;

interface CheckoutWizardShellProps {
  /** شاخهٔ فعلی (۰ تا ۲) */
  step: number;
  onStepChange: (step: number) => void;
  /**
   * اعتبارسنجی مرحلهٔ فعلی قبل از رفتن به مرحلهٔ بعد؛ پیام خطا را خود والد
   * (با همان قواعد فعلی) نمایش می‌دهد. `true` یعنی اجازهٔ عبور.
   */
  validateStep: (step: number) => boolean;
  /** محتوای هر مرحله به همان ترتیب CHECKOUT_WIZARD_STEPS */
  stepsContent: [ReactNode, ReactNode, ReactNode];
  /** کارت دارای اقلام معتبر است (برای فعال بودن «مرحله بعد» در گام اول) */
  hasCartItems: boolean;
  /** در حال ثبت سفارش/شروع پرداخت (برای جلوگیری از ثبت دوباره) */
  submitting: boolean;
  /** dom/active بودن دکمهٔ نهایی (همان isCheckoutSubmittable موجود) */
  canSubmit: boolean;
  submitLabel: string;
}

export default function CheckoutWizardShell({
  step,
  onStepChange,
  validateStep,
  stepsContent,
  hasCartItems,
  submitting,
  canSubmit,
  submitLabel,
}: CheckoutWizardShellProps) {
  const isFirst = step === 0;
  const isLast = step === CHECKOUT_WIZARD_STEPS.length - 1;

  const goNext = () => {
    if (step === 0 && !hasCartItems) return;
    if (!validateStep(step)) return;
    onStepChange(step + 1);
  };

  const goPrev = () => {
    if (!isFirst) onStepChange(step - 1);
  };

  return (
    <div dir="rtl" className="flex flex-col">
      {/* شاخص سه‌مرحله‌ای */}
      <nav
        aria-label="مراحل تکمیل سفارش"
        className="rounded-xl border border-gray-200 bg-white px-3 py-3"
      >
        <ol className="flex items-center">
          {CHECKOUT_WIZARD_STEPS.map((label, index) => {
            const state =
              index < step
                ? 'done'
                : index === step
                  ? 'current'
                  : 'upcoming';

            return (
              <li
                key={label}
                aria-current={state === 'current' ? 'step' : undefined}
                className={cn('flex items-center', index > 0 && 'flex-1')}
              >
                {/* خط اتصال بین مراحل */}
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mx-2 h-px flex-1',
                      index <= step ? 'bg-stone-900' : 'bg-gray-200',
                    )}
                  />
                )}
                <button
                  type="button"
                  disabled={index > step}
                  onClick={() => index < step && onStepChange(index)}
                  className={cn(
                    'flex items-center gap-1.5',
                    index > step ? 'cursor-not-allowed' : 'cursor-pointer',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                      state === 'current' &&
                        'border-stone-900 bg-stone-900 text-white',
                      state === 'done' && 'border-stone-900 text-stone-900',
                      state === 'upcoming' && 'border-gray-300 text-gray-400',
                    )}
                  >
                    {state === 'done' ? (
                      <Check className="size-3.5" aria-hidden="true" />
                    ) : (
                      (index + 1).toLocaleString('fa-IR')
                    )}
                  </span>
                  <span
                    className={cn(
                      'whitespace-nowrap text-[11px] font-medium sm:text-xs',
                      state === 'current' && 'font-semibold text-stone-900',
                      state === 'done' && 'text-stone-700',
                      state === 'upcoming' && 'text-gray-400',
                    )}
                  >
                    {label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* محتوای مرحلهٔ فعلی؛ بقیه mount اما مخفی می‌مانند */}
      <div className="mt-4 flex-1">
        {stepsContent.map((content, index) => (
          <div key={index} className={cn(index === step ? 'block' : 'hidden')}>
            {content}
          </div>
        ))}
      </div>

      {/* دکمه‌های پیمایش (چسبیده به پایین صفحه در موبایل) */}
      <div className="sticky bottom-0 z-30 mt-4 border-t border-gray-200 bg-background/90 px-1 py-3 backdrop-blur">
        {isLast ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={goPrev}
              className="h-12 w-12 shrink-0 rounded-xl"
              aria-label="مرحله قبل"
            >
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button
              type="submit"
              variant="dark"
              className="h-12 w-full rounded-xl text-sm font-semibold"
              loading={submitting}
              disabled={!canSubmit}
            >
              {submitLabel}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            {/* در RTL اولین فرزند در سمت راست قرار می‌گیرد */}
            <Button
              type="button"
              variant="dark"
              onClick={goNext}
              disabled={isFirst && !hasCartItems}
              className="h-12 flex-1 rounded-xl text-sm font-semibold"
            >
              مرحله بعد
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={goPrev}
              disabled={isFirst}
              className="h-12 flex-1 rounded-xl text-sm font-medium"
            >
              <ArrowRight className="size-4" aria-hidden="true" />
              مرحله قبل
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
