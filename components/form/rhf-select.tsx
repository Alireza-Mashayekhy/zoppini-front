import { Controller, useFormContext } from 'react-hook-form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { Field, FieldError, FieldLabel } from '../ui/field';

export type RHFSelectProps = React.ComponentProps<'select'> & {
  name: string;
  label?: string;
  items?: { value: string; text?: string }[];
  placeholder?: string;
};

export default function RHFSelect({ ...other }: RHFSelectProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={other.name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{other?.label}</FieldLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
            defaultValue={field.value}
          >
            <SelectTrigger
              className={cn('w-full', other.className)}
              aria-invalid={fieldState.invalid}
              disabled={other.disabled}
            >
              <SelectValue placeholder={other?.placeholder} />
            </SelectTrigger>
            <SelectContent position="popper">
              {other.items?.map((item, index) => (
                <SelectItem key={index} value={item.value}>
                  {item?.text || item.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
