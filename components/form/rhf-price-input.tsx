import { Controller, useFormContext } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type RHFPriceInputProps = {
  name?: string; // اختیاری برای حالت controlled خارجی
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  // پراپ‌های خارجی (برای استفاده در جدول واریانت‌ها)
  value?: number | string;
  onChange?: (value: number) => void;
};

export default function RHFPriceInput({
  name,
  label,
  value: externalValue,
  onChange: externalOnChange,
  ...props
}: RHFPriceInputProps) {
  const formContext = useFormContext();

  // تابع فرمت کردن عدد با جداکننده هزارگان
  const formatNumber = (value: number | string) => {
    if (value === '' || value === null || value === undefined) return '';
    const num =
      typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US');
  };

  // اگر از خارج value و onChange داده شده، از حالت controlled استفاده کن
  const isExternalControlled =
    externalValue !== undefined && externalOnChange !== undefined;

  // اگر نام وجود نداشته باشد و حالت خارجی نباشد، خطا بده
  if (!name && !isExternalControlled) {
    console.warn(
      'RHFPriceInput: either name or value/onChange must be provided',
    );
    return null;
  }

  // حالت خارجی (controlled by parent)
  if (isExternalControlled) {
    const displayValue = formatNumber(externalValue ?? '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/,/g, '');
      const numeric = raw.replace(/[^0-9]/g, '');
      externalOnChange(numeric ? parseFloat(numeric) : 0);
    };

    return (
      <div>
        {label && (
          <label className="block text-sm font-medium mb-1">{label}</label>
        )}
        <Input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={props.placeholder}
          disabled={props.disabled}
          className={cn(props.className)}
        />
      </div>
    );
  }

  // حالت react-hook-form (controlled by form)
  return (
    <Controller
      name={name!}
      control={formContext.control}
      render={({ field, fieldState }) => {
        const rawValue = field.value ?? '';
        const displayValue = formatNumber(rawValue);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const raw = e.target.value.replace(/,/g, '');
          const numeric = raw.replace(/[^0-9]/g, '');
          field.onChange(numeric ? parseFloat(numeric) : '');
        };

        return (
          <div>
            {label && (
              <label
                htmlFor={field.name}
                className="block text-sm font-medium mb-1"
              >
                {label}
              </label>
            )}
            <Input
              type="text"
              id={field.name}
              value={displayValue}
              onChange={handleChange}
              placeholder={props.placeholder}
              disabled={props.disabled}
              className={cn(
                props.className,
                fieldState.invalid && 'border-destructive',
              )}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && (
              <p className="text-sm text-destructive mt-1">
                {fieldState.error?.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
