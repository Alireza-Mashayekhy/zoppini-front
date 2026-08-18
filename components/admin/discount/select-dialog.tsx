'use client';

import { Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { useAdminCategoriesList } from '@/services/features/categories/hooks';
import { useAdminProducsList } from '@/services/features/products/hooks';
import { useUsersList } from '@/services/features/users/hooks';

export type DiscountSelectType = 'users' | 'products' | 'categories';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  type: DiscountSelectType;

  title: string;

  selectedIds: number[];

  selectedItems?: SelectItem[];

  onConfirm: (ids: number[]) => void;
}

interface SelectItem {
  id: number;
  title: string;
  subtitle?: string;
}

export default function DiscountSelectDialog({
  open,
  onOpenChange,
  type,
  title,
  selectedIds,
  onConfirm,
}: Props) {
  const [search, setSearch] = useState('');

  const [localSelectedIds, setLocalSelectedIds] =
    useState<number[]>(selectedIds);

  const debouncedSearch = useDebounce(search, 400);

  /*
   * وقتی دیالوگ باز می‌شود،
   * مقدار انتخاب‌های قبلی را بگیر.
   */
  useEffect(() => {
    if (open) {
      setLocalSelectedIds(selectedIds);
      setSearch('');
    }
  }, [open, selectedIds]);

  /*
   * ==========================
   * Users
   * ==========================
   */

  const usersQuery = useUsersList({
    page: 1,
    search: debouncedSearch,
  });

  /*
   * ==========================
   * Products
   * ==========================
   */

  const productsQuery = useAdminProducsList({
    page: 1,
    search: debouncedSearch,
    all: false,
    limit: 20,
  });

  /*
   * ==========================
   * Categories
   * ==========================
   */

  const categoriesQuery = useAdminCategoriesList({
    page: 1,
    search: debouncedSearch,
    all: false,
    limit: 20,
  });

  /*
   * فقط query مربوط به دیالوگ فعلی را استفاده می‌کنیم.
   */

  let items: SelectItem[] = [];

  let isLoading = false;

  if (type === 'users') {
    items =
      usersQuery.data?.data?.map(user => ({
        id: user.id,
        title: user.fullName || user.phone || `کاربر ${user.id}`,
        subtitle: user.phone || user.email,
      })) ?? [];

    isLoading = usersQuery.isLoading;
  }

  if (type === 'products') {
    items =
      productsQuery.data?.data?.map(product => ({
        id: product.id,
        title: product.title,
        subtitle: product.productCode,
      })) ?? [];

    isLoading = productsQuery.isLoading;
  }

  if (type === 'categories') {
    items =
      categoriesQuery.data?.data?.map(category => ({
        id: category.id,
        title: category.name,
        subtitle: category.slug,
      })) ?? [];

    isLoading = categoriesQuery.isLoading;
  }

  const toggleItem = (id: number) => {
    setLocalSelectedIds(current => {
      if (current.includes(id)) {
        return current.filter(itemId => itemId !== id);
      }

      return [...current, id];
    });
  };

  const handleConfirm = () => {
    onConfirm(localSelectedIds);
    onOpenChange(false);
  };

  const handleSelectAllVisible = () => {
    const visibleIds = items.map(item => item.id);

    setLocalSelectedIds(current => {
      const merged = new Set([...current, ...visibleIds]);

      return Array.from(merged);
    });
  };

  const handleClear = () => {
    setLocalSelectedIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}

          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="جستجو..."
              className="pr-9"
            />
          </div>

          {/* Selected count */}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {localSelectedIds.length} مورد انتخاب شده
            </span>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAllVisible}
                disabled={!items.length}
              >
                انتخاب نتایج
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={!localSelectedIds.length}
              >
                پاک کردن
              </Button>
            </div>
          </div>

          {/* List */}

          <div className="max-h-[400px] overflow-y-auto rounded-lg border">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                {search
                  ? 'موردی با این جستجو پیدا نشد.'
                  : 'موردی برای نمایش وجود ندارد.'}
              </div>
            ) : (
              <div className="divide-y">
                {items.map(item => {
                  const selected = localSelectedIds.includes(item.id);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-right transition ${
                        selected ? 'bg-primary/10' : 'hover:bg-muted'
                      }`}
                    >
                      {/* Checkbox */}

                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input'
                        }`}
                      >
                        {selected && <span className="text-xs">✓</span>}
                      </div>

                      {/* Text */}

                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{item.title}</div>

                        {item.subtitle && (
                          <div className="truncate text-xs text-muted-foreground">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>

            <Button type="button" onClick={handleConfirm}>
              تأیید انتخاب
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
