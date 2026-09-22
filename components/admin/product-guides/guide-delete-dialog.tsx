'use client';

import { AlertTriangle, Archive, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useGuideMutations,
  useGuideUsage,
} from '@/services/features/product-guides/hooks';
import { GuideType } from '@/services/features/product-guides/type';

export interface GuideOption {
  id: number;
  name: string;
}

/**
 * حذف یا بایگانی راهنما
 *
 * اگر راهنما به محصول یا دسته‌ای متصل باشد، اول محل استفاده نمایش داده می‌شود و
 * ادمین می‌تواند راهنمای جانشین انتخاب کند تا اتصال‌ها منتقل شوند.
 */
export default function GuideDeleteDialog({
  open,
  onOpenChange,
  type,
  guide,
  options = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: GuideType;
  guide: GuideOption | null;
  options?: GuideOption[];
}) {
  const { data, isLoading } = useGuideUsage(type, guide?.id);

  const mutations = useGuideMutations();

  const [replacementId, setReplacementId] = useState<string>('');
  const [force, setForce] = useState(false);

  useEffect(() => {
    if (!open) return;

    setReplacementId('');
    setForce(false);
  }, [open, guide?.id]);

  const usage = data?.data;

  const totalProducts = usage?.totalProducts ?? 0;
  const totalCategories = usage?.categories.length ?? 0;
  const overrideProducts = usage?.overrides.productCount ?? 0;

  const pendingMutation =
    type === 'size-table'
      ? mutations.deleteSizeTable
      : type === 'care-guide'
        ? mutations.deleteCareGuide
        : mutations.deleteMeasurementGuide;

  const archiveMutation =
    type === 'size-table'
      ? mutations.archiveSizeTable
      : type === 'care-guide'
        ? mutations.archiveCareGuide
        : mutations.archiveMeasurementGuide;

  const handleDelete = async () => {
    if (!guide) return;

    if (
      !replacementId &&
      !force &&
      (totalProducts > 0 || totalCategories > 0)
    ) {
      toast.error(
        'ابتدا راهنمای جانشین را انتخاب کنید یا حذف بدون جانشین را تأیید کنید.',
      );

      return;
    }

    try {
      await pendingMutation.mutateAsync({
        id: guide.id,
        replaceWithId: replacementId ? Number(replacementId) : undefined,
        force: force || Boolean(replacementId),
      });

      onOpenChange(false);
    } catch {
      /** پیام خطا در هوک نمایش داده می‌شود */
    }
  };

  const handleArchive = async () => {
    if (!guide) return;

    try {
      await archiveMutation.mutateAsync({ id: guide.id, isArchived: true });

      onOpenChange(false);
    } catch {
      /** پیام خطا در هوک نمایش داده می‌شود */
    }
  };

  const hasUsage = totalProducts > 0 || totalCategories > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl! flex-col gap-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle>حذف یا بایگانی «{guide?.name}»</DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto pl-1 text-sm">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              در حال بررسی محل استفاده...
            </div>
          ) : hasUsage ? (
            <>
              <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
                <AlertTriangle className="mt-0.5 size-5 shrink-0" />

                <div className="leading-7">
                  این راهنما در <b>{totalCategories} دسته</b> و{' '}
                  <b>{totalProducts} محصول</b> استفاده شده است
                  {overrideProducts > 0 && (
                    <>
                      {' '}
                      و <b>{overrideProducts} محصول</b> تغییر اختصاصی دارند
                    </>
                  )}
                  .
                </div>
              </div>

              {Boolean(usage?.categories.length) && (
                <div className="space-y-1">
                  <div className="font-medium">دسته‌های متصل:</div>

                  <div className="flex flex-wrap gap-2">
                    {usage?.categories.map(category => (
                      <span
                        key={category.id}
                        className="rounded-full bg-muted px-3 py-1 text-xs"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {Boolean(usage?.directProducts.length) && (
                <div className="space-y-1">
                  <div className="font-medium">محصولات با انتخاب مستقیم:</div>

                  <div className="flex flex-wrap gap-2">
                    {usage?.directProducts.slice(0, 20).map(product => (
                      <span
                        key={product.id}
                        className="rounded-full bg-muted px-3 py-1 text-xs"
                      >
                        {product.title}
                      </span>
                    ))}

                    {(usage?.directProducts.length ?? 0) > 20 && (
                      <span className="text-xs text-muted-foreground">
                        و {usage!.directProducts.length - 20} محصول دیگر
                      </span>
                    )}
                  </div>
                </div>
              )}

              {Boolean(usage?.productsByCategory.length) && (
                <div className="space-y-1">
                  <div className="font-medium">
                    محصولات مشمول از طریق دسته (نمونه):
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {usage?.productsByCategory.slice(0, 12).map(product => (
                      <span
                        key={product.id}
                        className="rounded-full bg-muted px-3 py-1 text-xs"
                      >
                        {product.title}
                      </span>
                    ))}

                    {(usage?.productsByCategory.length ?? 0) > 12 && (
                      <span className="text-xs text-muted-foreground">
                        و {usage!.productsByCategory.length - 12} محصول دیگر
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2 rounded-lg border p-3">
                <div className="font-medium">راهنمای جانشین (اختیاری)</div>

                <Select value={replacementId} onValueChange={setReplacementId}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="انتخاب راهنمای جانشین..." />
                  </SelectTrigger>

                  <SelectContent>
                    {options
                      .filter(option => option.id !== guide?.id)
                      .map(option => (
                        <SelectItem key={option.id} value={String(option.id)}>
                          {option.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <p className="text-xs text-muted-foreground leading-6">
                  با انتخاب جانشین، اتصال همه دسته‌ها و محصولات به راهنمای جدید
                  منتقل می‌شود و تغییرات اختصاصی روی راهنمای جدید بازبینی
                  می‌شوند.
                </p>
              </div>

              <label className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                <input
                  type="checkbox"
                  checked={force}
                  onChange={event => setForce(event.target.checked)}
                  className="mt-0.5"
                />

                <span className="leading-6">
                  می‌دانم که با حذف، اتصال این راهنما از دسته‌ها و محصولات پاک
                  می‌شود و آن بخش‌ها تا انتخاب راهنمای جدید نمایش داده نمی‌شوند.
                </span>
              </label>
            </>
          ) : (
            <div className="rounded-lg border p-4 text-muted-foreground">
              این راهنما به هیچ دسته یا محصولی متصل نیست و می‌توانید مستقیم حذف
              کنید.
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleArchive}
            loading={archiveMutation.isPending}
          >
            <Archive className="size-4" />
            بایگانی به‌جای حذف
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            loading={pendingMutation.isPending}
          >
            <Trash2 className="size-4" />
            حذف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
