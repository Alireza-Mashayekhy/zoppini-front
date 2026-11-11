'use client';

import { Check, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { useAdminCategoriesList } from '@/services/features/categories/hooks';
import { useAdminProducsList } from '@/services/features/products/hooks';

export type ScopePickerKind = 'products' | 'categories';

interface ScopePickerProps {
  kind: ScopePickerKind;
  label: string;
  hint?: string;
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  className?: string;
}

interface NamedItem {
  id: number;
  title: string;
  subtitle?: string;
}

/**
 * انتخاب چندتایی محصول/دسته برای دامنهٔ پروموشن یا استثناها.
 * فقط شناسه‌ها ذخیره می‌شوند؛ برچسب‌ها از همان لیست سرور می‌آیند.
 */
export default function ScopePicker({
  kind,
  label,
  hint,
  value,
  onChange,
  disabled,
  className,
}: ScopePickerProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [open, setOpen] = useState(false);

  const productsQuery = useAdminProducsList({
    page: 1,
    search: debouncedSearch,
    limit: 20,
    all: false,
  });

  const categoriesQuery = useAdminCategoriesList({
    page: 1,
    search: debouncedSearch,
    limit: 20,
    all: false,
  });

  const items: NamedItem[] = useMemo(() => {
    if (kind === 'products') {
      return (
        productsQuery.data?.data?.map(product => ({
          id: product.id,
          title: product.title,
          subtitle: product.productCode,
        })) ?? []
      );
    }

    return (
      categoriesQuery.data?.data?.map(category => ({
        id: category.id,
        title: category.name,
        subtitle: category.slug,
      })) ?? []
    );
  }, [kind, productsQuery.data, categoriesQuery.data]);

  const isLoading =
    kind === 'products' ? productsQuery.isLoading : categoriesQuery.isLoading;

  const selected = useMemo(() => new Set(value), [value]);

  const toggle = (id: number) => {
    if (selected.has(id)) {
      onChange(value.filter(entry => entry !== id));
      return;
    }

    onChange([...value, id]);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>

          {hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => setOpen(prev => !prev)}
        >
          {open ? 'بستن' : 'انتخاب'}
          {value.length > 0 && (
            <span className="ms-1 bg-primary px-1.5 text-[10px] text-background">
              {value.length.toLocaleString('fa-IR')}
            </span>
          )}
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(id => (
            <span
              key={id}
              className="inline-flex items-center gap-1 border bg-muted/40 px-2 py-0.5 text-xs"
            >
              {kind === 'products' ? 'محصول' : 'دسته'} #{id}
              <button
                type="button"
                aria-label="حذف"
                disabled={disabled}
                onClick={() => onChange(value.filter(entry => entry !== id))}
                className="text-muted-foreground hover:text-red-600"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="space-y-2 border bg-white p-2">
          <div className="relative">
            <Search className="absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={kind === 'products' ? 'جستجوی محصول...' : 'جستجوی دسته...'}
              className="h-8 pr-8 text-xs"
            />
          </div>

          <div className="max-h-52 overflow-y-auto">
            {isLoading && (
              <p className="p-2 text-xs text-muted-foreground">در حال دریافت...</p>
            )}

            {!isLoading && !items.length && (
              <p className="p-2 text-xs text-muted-foreground">موردی یافت نشد.</p>
            )}

            {items.map(item => {
              const isSelected = selected.has(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-2 py-1.5 text-right text-xs hover:bg-muted',
                    isSelected && 'bg-muted/60',
                  )}
                >
                  <span className="min-w-0">
                    <span className="line-clamp-1">{item.title}</span>
                    {item.subtitle && (
                      <span className="block text-[10px] text-muted-foreground">
                        {item.subtitle}
                      </span>
                    )}
                  </span>

                  {isSelected && <Check className="size-3.5 text-green-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
