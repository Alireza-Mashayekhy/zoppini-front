'use client';
import { Controller, useFormContext } from 'react-hook-form';

import { cn } from '@/lib/utils';

import { Field, FieldError, FieldLabel } from '../ui/field';

export type RHFBooleanSegmentProps = {
  name: string;
  label?: string;
  /** متن گزینه‌ی «بله» (سبز) */
  yesLabel: string;
  /** متن گزینه‌ی «خیر» (قرمز) */
  noLabel: string;
  className?: string;
};

/**
 * کنترل دوراهی «بله/خیر» برای فیلدهای بولین فرم —
 * مثل «ایندکس شود/نشد» یا «فالو شود/نشد» در بخش‌های سئو.
 */
export default function RHFBooleanSegment({
  name,
  label,
  yesLabel,
  noLabel,
  className,
}: RHFBooleanSegmentProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
          <div
            role="group"
            aria-label={label}
            className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/40 p-1"
          >
            {[
              { value: true, text: yesLabel },
              { value: false, text: noLabel },
            ].map(option => {
              const selected = field.value === option.value;

              return (
                <button
                  key={String(option.value)}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => field.onChange(option.value)}
                  className={cn(
                    'rounded-md px-2 py-1.5 text-center text-sm font-medium transition-colors',
                    selected
                      ? option.value
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-red-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-white/80',
                  )}
                >
                  {option.text}
                </button>
              );
            })}
          </div>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
