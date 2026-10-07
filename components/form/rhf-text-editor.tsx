'use client';

import { Controller, useFormContext } from 'react-hook-form';

import ZoppiniEditor from '@/components/editor/zoppini-editor';
import { cn } from '@/lib/utils';

/**
 * ویرایشگر متن برای فرم‌های react-hook-form.
 *
 * همان ادیتور یکپارچه‌ی Tiptap است (بدون وابستگی به پکیج خارجی) و برای
 * توضیحات محصول، دسته‌بندی و هر فیلد متنی غنی دیگر استفاده می‌شود.
 */
export function RHFTextEditor({
  name,
  label,
  placeholder,
  className,
  minHeight = 220,
  disabled = false,
}: {
  name: string;
  label?: string;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  disabled?: boolean;
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, value } }) => (
          <ZoppiniEditor
            id={name}
            value={typeof value === 'string' ? value : ''}
            onChange={onChange}
            placeholder={placeholder}
            minHeight={minHeight}
            disabled={disabled}
          />
        )}
      />

      {error && (
        <p className="text-sm text-red-600">{error.message as string}</p>
      )}
    </div>
  );
}
