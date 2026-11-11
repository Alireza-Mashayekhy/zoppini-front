'use client';

import { Plus, RefreshCcw, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import PreviewPanel from '@/components/admin/promotion/preview-panel';
import PromotionForm from '@/components/admin/promotion/promotion-form';
import PromotionTable from '@/components/admin/promotion/promotion-table';
import { formatNumber, formatPrice } from '@/components/admin/promotion/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useAdminPromotion,
  useAdminPromotions,
  useCreatePromotion,
  useDeletePromotion,
  useSetPromotionStatus,
  useUpdatePromotion,
} from '@/services/features/promotions/hooks';
import { usePromotionRedemptions } from '@/services/features/promotions/hooks';
import { Promotion } from '@/services/features/promotions/types';

type DialogMode = 'create' | 'edit' | null;

export default function PromotionsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [mode, setMode] = useState<DialogMode>(null);
  const [selected, setSelected] = useState<Promotion | null>(null);

  const [previewId, setPreviewId] = useState<number | null>(null);
  const [redemptionsFor, setRedemptionsFor] = useState<Promotion | null>(null);

  const list = useAdminPromotions({ search: debouncedSearch });
  const detail = useAdminPromotion(selected?.id ?? undefined);

  const create = useCreatePromotion();
  const update = useUpdatePromotion();
  const remove = useDeletePromotion();
  const setStatus = useSetPromotionStatus();

  const promotions = list.data?.data ?? [];

  // در حالت ویرایش، جزئیات تازه‌تر از سرور (شامل روابط) را ترجیح می‌دهیم
  const editTarget = detail.data?.data ?? selected;

  const closeDialog = () => {
    setMode(null);
    setSelected(null);
  };

  const handleCreate = () => {
    setSelected(null);
    setMode('create');
  };

  const handleEdit = (promotion: Promotion) => {
    setSelected(promotion);
    setMode('edit');
  };

  const handleSubmit = (dto: Parameters<typeof create.mutate>[0]) => {
    if (mode === 'edit' && selected) {
      /*
       * نوع پروموشن هم ارسال می‌شود: سرور تغییر نوع را می‌پذیرد و پیکربندی
       * را دوباره اعتبارسنجی می‌کند. اگر آن را حذف کنیم، تغییر نوع در فرم
       * بی‌صدا نادیده گرفته می‌شد و مدیر فکر می‌کرد ذخیره شده است.
       */
      update.mutate(
        { id: selected.id, dto },
        {
          onSuccess: () => {
            toast.success('پروموشن ویرایش شد.');
            closeDialog();
          },
          onError: () => toast.error('ویرایش انجام نشد.'),
        },
      );

      return;
    }

    create.mutate(dto, {
      onSuccess: () => {
        toast.success('پروموشن ایجاد شد.');
        closeDialog();
      },
      onError: () => toast.error('ایجاد انجام نشد.'),
    });
  };

  const handleToggle = (promotion: Promotion) => {
    setStatus.mutate(
      { id: promotion.id, isActive: !promotion.isActive },
      {
        onSuccess: () =>
          toast.success(
            promotion.isActive ? 'پروموشن غیرفعال شد.' : 'پروموشن فعال شد.',
          ),
        onError: () => toast.error('تغییر وضعیت انجام نشد.'),
      },
    );
  };

  const handleDelete = (promotion: Promotion) => {
    const confirmed = window.confirm(
      `آیا از حذف پروموشن «${promotion.name}» مطمئن هستید؟ سفارش‌های گذشته دست‌نخورده می‌مانند.`,
    );

    if (!confirmed) {
      return;
    }

    remove.mutate(promotion.id, {
      onSuccess: () => toast.success('پروموشن حذف شد.'),
      onError: () => toast.error('حذف انجام نشد.'),
    });
  };

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      {/* =====================================================
          Header
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">پیشنهادهای ویژه</h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            ساخت و مدیریت پیشنهادهای فروش: خرید تعداد و تخفیف روی ارزان‌تر، خرید
            X دریافت Y، دریافت هدیه، تخفیف پله‌ای و ارسال رایگان. نشان پیشنهاد
            روی صفحهٔ محصول نمایش داده می‌شود اما قیمت کارت را تغییر نمی‌دهد؛
            قیمت قابل پرداخت فقط در سبد و پس از احراز شرط محاسبه می‌شود.
          </p>
        </div>

        <Button onClick={handleCreate}>
          <Plus className="ml-2 h-4 w-4" />
          ایجاد پروموشن
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
            onChange={event => setSearch(event.target.value)}
            placeholder="جستجو بر اساس نام یا توضیح داخلی..."
            className="pr-10"
          />
        </div>

        <Button
          variant="outline"
          onClick={() => list.refetch()}
          disabled={list.isFetching}
        >
          <RefreshCcw
            className={`ml-2 h-4 w-4 ${list.isFetching ? 'animate-spin' : ''}`}
          />
          بروزرسانی
        </Button>
      </div>

      {/* =====================================================
          Table
      ====================================================== */}

      {list.isLoading ? (
        <div className="space-y-2 rounded-xl border bg-white p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : list.isError ? (
        <div role="alert" className="space-y-3 rounded-xl border bg-white p-4">
          <p className="text-sm text-destructive">
            دریافت فهرست پروموشن‌ها انجام نشد. لطفاً دوباره تلاش کنید.
          </p>
          <Button
            variant="outline"
            onClick={() => list.refetch()}
            disabled={list.isFetching}
          >
            تلاش مجدد
          </Button>
        </div>
      ) : (
        <PromotionTable
          promotions={promotions}
          onEdit={handleEdit}
          onToggleStatus={handleToggle}
          onDelete={handleDelete}
          onPreview={promotion => setPreviewId(promotion.id)}
          onRedemptions={promotion => setRedemptionsFor(promotion)}
          busyId={
            setStatus.isPending ? (setStatus.variables?.id ?? null) : null
          }
        />
      )}

      {/* =====================================================
          Create / Edit dialog
      ====================================================== */}

      <Dialog
        open={mode === 'create'}
        onOpenChange={open => !open && closeDialog()}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>ایجاد پروموشن</DialogTitle>
          </DialogHeader>

          <PromotionForm onSubmit={handleSubmit} isPending={create.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={mode === 'edit'}
        onOpenChange={open => !open && closeDialog()}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>ویرایش پروموشن</DialogTitle>
          </DialogHeader>

          {editTarget ? (
            <PromotionForm
              key={editTarget.id}
              promotion={editTarget}
              onSubmit={handleSubmit}
              isPending={update.isPending}
            />
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* =====================================================
          Preview dialog
      ====================================================== */}

      <Dialog
        open={previewId !== null}
        onOpenChange={open => !open && setPreviewId(null)}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>پیش‌نمایش پروموشن</DialogTitle>
          </DialogHeader>

          {previewId !== null && <PreviewPanel promotionId={previewId} />}
        </DialogContent>
      </Dialog>

      {/* =====================================================
          Redemptions dialog
      ====================================================== */}

      <Dialog
        open={!!redemptionsFor}
        onOpenChange={open => !open && setRedemptionsFor(null)}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              سفارش‌های استفاده‌کننده از «{redemptionsFor?.name}»
            </DialogTitle>
          </DialogHeader>

          {redemptionsFor && (
            <RedemptionsList promotionId={redemptionsFor.id} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * لیست سفارش‌هایی که این پروموشن در آن‌ها اعمال شده است.
 * مبالغ از اسنپ‌شات سفارش خوانده می‌شوند، نه از تنظیمات فعلی پروموشن؛
 * بنابراین پس از ویرایش پروموشن هم تاریخچه تغییر نمی‌کند.
 */
function RedemptionsList({ promotionId }: { promotionId: number }) {
  const { data, isLoading } = usePromotionRedemptions(promotionId);

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  const rows = data?.data ?? [];

  if (!rows.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        هنوز سفارشی از این پروموشن استفاده نکرده است.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map(row => (
        <div key={row.orderId} className="border p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              سفارش {row.orderNumber ?? formatNumber(row.orderId)}
            </span>

            <span className="text-muted-foreground">
              {row.usedAt
                ? new Intl.DateTimeFormat('fa-IR', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(new Date(row.usedAt))
                : '—'}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span>تخفیف ثبت‌شده: {formatPrice(row.discountAmount)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
