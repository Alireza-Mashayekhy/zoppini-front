import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type RHFMultiSelectProps = {
  name: string;
  label?: string;
  items?: { value: string; text?: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export default function RHFMultiSelect({ ...other }: RHFMultiSelectProps) {
  const { control } = useFormContext();
  const [open, setOpen] = useState(false);

  return (
    <Controller
      name={other.name}
      control={control}
      render={({ field, fieldState }) => {
        // ✅ مقدار فعلی را به‌صورت ایمن به آرایه تبدیل کن
        const selectedValues = Array.isArray(field.value) ? field.value : [];

        const handleSelect = (value: string) => {
          const isSelected = selectedValues.includes(value);
          const newValues = isSelected
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
          field.onChange(newValues);
        };

        const handleRemove = (value: string, e: React.MouseEvent) => {
          e.stopPropagation();
          e.preventDefault();
          handleSelect(value);
        };

        const selectedItems =
          other.items?.filter(item => selectedValues.includes(item.value)) ||
          [];

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{other?.label}</FieldLabel>

            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  disabled={other.disabled}
                  className={cn(
                    'w-full justify-between',
                    !selectedValues.length && 'text-muted-foreground',
                    other.className,
                  )}
                >
                  <div className="flex flex-wrap gap-1">
                    {selectedItems.length > 0 ? (
                      selectedItems.map(item => (
                        <Badge
                          key={item.value}
                          variant="secondary"
                          className="mr-1"
                        >
                          {item.text || item.value}
                          <button
                            type="button"
                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onMouseDown={e => handleRemove(item.value, e)}
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <span>
                        {other?.placeholder || 'موارد را انتخاب کنید...'}
                      </span>
                    )}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search..." />
                  <CommandEmpty>موردی یافت نشد.</CommandEmpty>
                  <CommandGroup>
                    {other.items?.map(item => {
                      const isSelected = selectedValues.includes(item.value);
                      return (
                        <CommandItem
                          key={item.value}
                          onSelect={() => handleSelect(item.value)}
                        >
                          <div
                            className={cn(
                              'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'opacity-50 [&_svg]:invisible',
                            )}
                          >
                            <Check className="h-4 w-4" />
                          </div>
                          <span>{item.text || item.value}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}
