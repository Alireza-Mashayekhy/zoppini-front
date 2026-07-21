// components/admin/product-multi-select.tsx
'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { useAdminProducsList } from '@/services/features/products/hooks';

interface ProductMultiSelectProps {
  value: string[]; // آرایه‌ای از شناسه‌های محصول (رشته)
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ProductMultiSelect({
  value,
  onValueChange,
  placeholder = 'انتخاب محصول...',
  disabled,
  className,
}: ProductMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useAdminProducsList({
    all: true,
    search: debouncedSearch,
  });

  const products = data?.data || [];

  const toggleProduct = (productId: string) => {
    if (value.includes(productId)) {
      onValueChange(value.filter(id => id !== productId));
    } else {
      onValueChange([...value, productId]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between', className)}
        >
          <span className="truncate">
            {value.length > 0
              ? `${value.length} محصول انتخاب شده`
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="جستجوی محصول..."
            value={search}
            onValueChange={setSearch}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'در حال جستجو...' : 'محصولی یافت نشد.'}
            </CommandEmpty>
            <CommandGroup>
              {products.map(product => (
                <CommandItem
                  key={product.id}
                  value={String(product.id)}
                  onSelect={() => toggleProduct(String(product.id))}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value.includes(String(product.id))
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                  {product.title} ({product.productCode})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
