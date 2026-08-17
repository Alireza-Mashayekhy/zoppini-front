'use client';

import { Plus, RefreshCcw, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import DiscountDialog from '@/components/admin/discount/dialog';
import DiscountTable from '@/components/admin/discount/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useAdminDiscounts,
  useCreateDiscount,
  useDeleteDiscount,
  useUpdateDiscount,
} from '@/services/features/discounts/admin.hooks';
import {
  CreateDiscountDto,
  Discount,
} from '@/services/features/discounts/types';

export default function DiscountsPage() {
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(
    null,
  );

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, isFetching, refetch } = useAdminDiscounts({
    search: debouncedSearch,
  });

  const createMutation = useCreateDiscount();
  const updateMutation = useUpdateDiscount();
  const deleteMutation = useDeleteDiscount();

  // =========================================================
  // Create / Update
  // =========================================================

  const handleSubmit = (dto: CreateDiscountDto) => {
    if (selectedDiscount) {
      updateMutation.mutate(
        {
          id: selectedDiscount.id,
          dto,
        },
        {
          onSuccess: () => {
            toast.success('کد تخفیف با موفقیت ویرایش شد.');

            setDialogOpen(false);
            setSelectedDiscount(null);
          },
        },
      );

      return;
    }

    createMutation.mutate(dto, {
      onSuccess: () => {
        toast.success('کد تخفیف با موفقیت ایجاد شد.');

        setDialogOpen(false);
      },
    });
  };

  // =========================================================
  // Edit
  // =========================================================

  const handleEdit = (discount: Discount) => {
    setSelectedDiscount(discount);
    setDialogOpen(true);
  };

  // =========================================================
  // Delete
  // =========================================================

  const handleDelete = (discount: Discount) => {
    const confirmed = window.confirm(
      `آیا از حذف کد تخفیف "${discount.code}" مطمئن هستید؟`,
    );

    if (!confirmed) return;

    deleteMutation.mutate(discount.id, {
      onSuccess: () => {
        toast.success('کد تخفیف با موفقیت حذف شد.');
      },
    });
  };

  // =========================================================
  // Open Create
  // =========================================================

  const handleCreate = () => {
    setSelectedDiscount(null);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      {/* =====================================================
          Header
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">کدهای تخفیف</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            مدیریت و ایجاد کدهای تخفیف فروشگاه
          </p>
        </div>

        <Button onClick={handleCreate}>
          <Plus className="ml-2 h-4 w-4" />
          ایجاد کد تخفیف
        </Button>
      </div>

      {/* =====================================================
          Search + Refresh
      ====================================================== */}

      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجو بر اساس کد تخفیف..."
            className="pr-10"
          />
        </div>

        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCcw
            className={`ml-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
          />
          بروزرسانی
        </Button>
      </div>

      {/* =====================================================
          Table
      ====================================================== */}

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border bg-white">
          <div className="text-sm text-muted-foreground">
            در حال دریافت کدهای تخفیف...
          </div>
        </div>
      ) : (
        <DiscountTable
          discounts={data?.data ?? []}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* =====================================================
          Dialog
      ====================================================== */}

      <DiscountDialog
        open={dialogOpen}
        onOpenChange={open => {
          setDialogOpen(open);

          if (!open) {
            setSelectedDiscount(null);
          }
        }}
        discountId={selectedDiscount?.id}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
