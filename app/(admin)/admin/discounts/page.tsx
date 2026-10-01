'use client';

import { Plus, RefreshCcw, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import DiscountCodeDialog from '@/components/admin/discount/code-dialog';
import DiscountCodeTable from '@/components/admin/discount/code-table';
import SaleDialog from '@/components/admin/discount/sale-dialog';
import SaleTable from '@/components/admin/discount/sale-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DiscountKind,
} from '@/services/features/discounts/types';

const KIND_TEXT = {
  [DiscountKind.SALE]: {
    title: 'فروش ویژه',
    description:
      'تخفیف خودکار روی محصولات یا دسته‌بندی‌ها در یک بازهٔ زمانی؛ همراه با نشان تخفیف و نمایش در صفحهٔ فروش ویژه',
    create: 'ایجاد فروش ویژه',
    search: 'جستجو بر اساس عنوان...',
    created: 'فروش ویژه با موفقیت ایجاد شد.',
    updated: 'فروش ویژه با موفقیت ویرایش شد.',
    deleted: 'فروش ویژه با موفقیت حذف شد.',
    loading: 'در حال دریافت فروش‌های ویژه...',
  },
  [DiscountKind.CODE]: {
    title: 'کد تخفیف',
    description:
      'کدی که مشتری هنگام پرداخت وارد می‌کند؛ با امکان استثنا کردن محصولات و تعیین تعداد دفعات استفادهٔ هر کاربر',
    create: 'ایجاد کد تخفیف',
    search: 'جستجو بر اساس کد تخفیف...',
    created: 'کد تخفیف با موفقیت ایجاد شد.',
    updated: 'کد تخفیف با موفقیت ویرایش شد.',
    deleted: 'کد تخفیف با موفقیت حذف شد.',
    loading: 'در حال دریافت کدهای تخفیف...',
  },
} as const;

export default function DiscountsPage() {
  const [kind, setKind] = useState<DiscountKind>(DiscountKind.SALE);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);

  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(
    null,
  );

  const debouncedSearch = useDebounce(search, 500);
  const text = KIND_TEXT[kind];

  const { data, isLoading, isFetching, refetch } = useAdminDiscounts({
    kind,
    search: debouncedSearch,
  });

  const createMutation = useCreateDiscount();
  const updateMutation = useUpdateDiscount();
  const deleteMutation = useDeleteDiscount();

  const handleKindChange = (value: string) => {
    setKind(value as DiscountKind);
    setSearch('');
    setDialogOpen(false);
    setSelectedDiscount(null);
  };

  // =========================================================
  // Create / Update
  // =========================================================

  const handleSubmit = (dto: CreateDiscountDto) => {
    if (selectedDiscount) {
      const { kind: _kind, ...updateDto } = dto;

      updateMutation.mutate(
        {
          id: selectedDiscount.id,
          dto: updateDto,
        },
        {
          onSuccess: () => {
            toast.success(text.updated);

            setDialogOpen(false);
            setSelectedDiscount(null);
          },
        },
      );

      return;
    }

    createMutation.mutate(dto, {
      onSuccess: () => {
        toast.success(text.created);

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
    const name = discount.title || discount.code;

    const confirmed = window.confirm(
      `آیا از حذف ${kind === DiscountKind.SALE ? 'فروش ویژه' : 'کد تخفیف'} "${name}" مطمئن هستید؟`,
    );

    if (!confirmed) return;

    deleteMutation.mutate(discount.id, {
      onSuccess: () => {
        toast.success(text.deleted);
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

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);

    if (!open) {
      setSelectedDiscount(null);
    }
  };

  const dialogProps = {
    open: dialogOpen,
    onOpenChange: handleDialogOpenChange,
    discountId: selectedDiscount?.id,
    onSubmit: handleSubmit,
    isPending: createMutation.isPending || updateMutation.isPending,
  };

  const discounts = data?.data ?? [];

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      {/* =====================================================
          Header
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">تخفیفات</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {text.description}
          </p>
        </div>

        <Button onClick={handleCreate}>
          <Plus className="ml-2 h-4 w-4" />
          {text.create}
        </Button>
      </div>

      <Tabs value={kind} onValueChange={handleKindChange}>
        <TabsList>
          <TabsTrigger value={DiscountKind.SALE}>فروش ویژه</TabsTrigger>

          <TabsTrigger value={DiscountKind.CODE}>کد تخفیف</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* =====================================================
          Search + Refresh
      ====================================================== */}

      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={text.search}
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
          <div className="text-sm text-muted-foreground">{text.loading}</div>
        </div>
      ) : kind === DiscountKind.SALE ? (
        <SaleTable
          discounts={discounts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <DiscountCodeTable
          discounts={discounts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* =====================================================
          Dialog
      ====================================================== */}

      {kind === DiscountKind.SALE ? (
        <SaleDialog {...dialogProps} />
      ) : (
        <DiscountCodeDialog {...dialogProps} />
      )}
    </div>
  );
}
