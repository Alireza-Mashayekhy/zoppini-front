'use client';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCreateCatalogPage,
  useUpdateCatalogPage,
} from '@/services/features/catalog/hooks';
import { CatalogPageResponse } from '@/services/features/catalog/types';

interface CatalogPageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedData?: CatalogPageResponse | null;
}

export default function CatalogPageModal({
  open,
  onOpenChange,
  selectedData,
}: CatalogPageModalProps) {
  const [page, setPage] = useState(1);
  const [image, setImage] = useState<File | null>(null);

  const createMutation = useCreateCatalogPage();
  const updateMutation = useUpdateCatalogPage();

  const isEdit = !!selectedData;

  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (selectedData) {
        setPage(selectedData.pageNumber);
      } else {
        setPage(1);
      }

      setImage(null);
    }
  }, [open, selectedData]);

  const handleSubmit = async () => {
    if (!image) {
      toast.error('لطفاً تصویر را انتخاب کنید');
      return;
    }

    if (page < 1) {
      toast.error('شماره صفحه معتبر نیست');
      return;
    }

    try {
      const formData = new FormData();

      formData.append('image', image);

      if (isEdit) {
        await updateMutation.mutateAsync({
          id: selectedData.id,
          formData,
        });

        toast.success('تصویر صفحه با موفقیت ویرایش شد.');
      } else {
        formData.append('page', String(page));

        await createMutation.mutateAsync(formData);

        toast.success('صفحه کاتالوگ با موفقیت اضافه شد.');
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);

      toast.error(
        isEdit
          ? 'ویرایش صفحه با خطا مواجه شد.'
          : 'افزودن صفحه با خطا مواجه شد.',
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'ویرایش صفحه کاتالوگ' : 'افزودن صفحه کاتالوگ'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label>شماره صفحه</Label>

              <Input
                type="number"
                min={1}
                value={page}
                onChange={event => setPage(Number(event.target.value))}
              />

              <p className="text-xs text-muted-foreground">
                اگر این شماره صفحه قبلاً وجود داشته باشد، صفحات بعدی یک شماره
                جابه‌جا می‌شوند.
              </p>
            </div>
          )}

          {isEdit && (
            <div className="rounded-md bg-muted px-3 py-2 text-sm">
              شماره صفحه: {selectedData.pageNumber}
            </div>
          )}

          <div className="space-y-2">
            <Label>تصویر صفحه</Label>

            <Input
              type="file"
              accept="image/*"
              onChange={event => {
                setImage(event.target.files?.[0] ?? null);
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            انصراف
          </Button>

          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending
              ? 'در حال پردازش...'
              : isEdit
                ? 'ذخیره تغییرات'
                : 'افزودن صفحه'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
