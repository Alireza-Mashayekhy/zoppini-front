import { Controller, useFormContext } from 'react-hook-form';

import { Input } from '@/components/ui/input'; // همان Input شما
import { cn } from '@/lib/utils';

type RHFPriceInputProps = {
  name: string;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export default function RHFPriceInput({
  name,
  label,
  ...props
}: RHFPriceInputProps) {
  const { control } = useFormContext();

  // تابع فرمت کردن عدد با جداکننده هزارگان
  const formatNumber = (value: number | string) => {
    if (value === '' || value === null || value === undefined) return '';
    const num =
      typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US'); // یا 'fa-IR' برای اعداد فارسی
  };

  // تبدیل رشته فرمت‌شده به عدد خام
  //   const parseNumber = (formatted: string) => {
  //     return formatted.replace(/,/g, '');
  //   };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const rawValue = field.value ?? '';
        const displayValue = formatNumber(rawValue);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const raw = e.target.value.replace(/,/g, ''); // حذف جداکننده‌ها
          const numeric = raw.replace(/[^0-9]/g, ''); // فقط اعداد
          field.onChange(numeric ? parseFloat(numeric) : ''); // ذخیره عدد خام
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
              type="text" // همیشه text باشه تا فرمت نمایش داده بشه
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
