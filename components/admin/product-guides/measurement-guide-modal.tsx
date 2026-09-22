'use client';

import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Images,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  getMeasurementGuide,
  reorderMeasurementImages,
  updateMeasurementImage,
} from '@/services/features/product-guides/api';
import {
  useGuideMutations,
  useGuideUsage,
  useMeasurementGuide,
} from '@/services/features/product-guides/hooks';

const MAX_SIZE = 2 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

type ImageDraft = {
  /** شناسه تصویر ذخیره‌شده روی سرور */
  id?: number;
  /** نام فایل برای تصاویر جدید */
  file?: File;
  /** آدرس نمایش */
  url: string;
  caption: string;
};

export default function MeasurementGuideModal({
  open,
  onOpenChange,
  guideId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guideId?: number | null;
}) {
  const isEdit = Boolean(guideId);

  const { data, isLoading } = useMeasurementGuide(guideId ?? undefined);

  const { data: usage } = useGuideUsage(
    'measurement-guide',
    guideId ?? undefined,
  );

  const { saveMeasurementGuide } = useGuideMutations();

  const inputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_URL ?? '';

  useEffect(() => {
    if (!open) return;

    if (!guideId) {
      setName('');
      setNotes('');
      setImages([]);

      return;
    }

    if (!data?.data) return;

    setName(data.data.name);
    setNotes(data.data.notes ?? '');
    setImages(
      data.data.images.map(image => ({
        id: image.id,
        url: `${imageBaseUrl}${image.file}`,
        caption: image.caption ?? '',
      })),
    );
  }, [open, guideId, data, imageBaseUrl]);

  const dependents = usage?.data;

  const totalProducts = dependents?.totalProducts ?? 0;
  const totalCategories = dependents?.categories.length ?? 0;

  const pickFiles = (files: FileList | null) => {
    if (!files?.length) return;

    const accepted: ImageDraft[] = [];

    Array.from(files).forEach(file => {
      if (!ACCEPTED.includes(file.type)) {
        toast.error(`فرمت فایل «${file.name}» مجاز نیست (jpeg, png, webp).`);

        return;
      }

      if (file.size > MAX_SIZE) {
        toast.error(`حجم فایل «${file.name}» بیشتر از ۲ مگابایت است.`);

        return;
      }

      accepted.push({
        file,
        url: URL.createObjectURL(file),
        caption: '',
      });
    });

    if (accepted.length) setImages(previous => [...previous, ...accepted]);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages(previous => {
      const target = index + direction;

      if (target < 0 || target >= previous.length) return previous;

      const next = [...previous];

      [next[index], next[target]] = [next[target], next[index]];

      return next;
    });
  };

  const removeImage = (index: number) => {
    setImages(previous => previous.filter((_, position) => position !== index));
  };

  const replaceImage = (index: number, file?: File) => {
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      toast.error('فرمت فایل مجاز نیست (jpeg, png, webp).');

      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error('حجم فایل نباید بیشتر از ۲ مگابایت باشد.');

      return;
    }

    setImages(previous =>
      previous.map((image, position) =>
        position === index
          ? { url: URL.createObjectURL(file), file, caption: image.caption }
          : image,
      ),
    );
  };

  const submit = async () => {
    if (!name.trim()) {
      toast.error('نام راهنمای تصویری را وارد کنید.');

      return;
    }

    if (!images.length) {
      toast.error('حداقل یک تصویر بارگذاری کنید.');

      return;
    }

    const formData = new FormData();

    formData.append('name', name.trim());

    if (notes.trim()) formData.append('notes', notes.trim());

    const keptIds = images
      .filter(image => image.id)
      .map(image => image.id as number);

    if (isEdit) formData.append('keepImageIds', JSON.stringify(keptIds));

    images
      .filter(image => image.file)
      .forEach(image => formData.append('files', image.file as File));

    try {
      const response = await saveMeasurementGuide.mutateAsync({
        id: guideId ?? undefined,
        formData,
      });

      const saved = response?.data;

      /** ثبت عنوان تصاویر با ترتیب نهایی */
      if (saved?.id) {
        await saveImageCaptions(saved.id, images);
      }

      onOpenChange(false);
    } catch {
      /** پیام خطا در هوک نمایش داده می‌شود */
    }
  };

  /**
   * بعد از ذخیره، ترتیب و توضیح تصاویر ثبت می‌شود.
   *
   * تصاویر قبلی با ترتیب انتخابی ادمین می‌مانند و فایل‌های جدید به همان
   * ترتیبی که در پنل دیده می‌شوند کنارشان قرار می‌گیرند.
   */
  const saveImageCaptions = async (id: number, drafts: ImageDraft[]) => {
    const guide = await getMeasurementGuide(id);

    const serverImages = guide?.data?.images ?? [];

    if (!serverImages.length) return;

    const usedIds = new Set<number>();

    const orderedIds: number[] = [];

    for (const draft of drafts) {
      if (draft.id) {
        orderedIds.push(draft.id);
        usedIds.add(draft.id);

        continue;
      }

      const next = serverImages.find(image => !usedIds.has(image.id));

      if (next) {
        orderedIds.push(next.id);
        usedIds.add(next.id);
      }
    }

    serverImages.forEach(image => {
      if (!usedIds.has(image.id)) orderedIds.push(image.id);
    });

    await reorderMeasurementImages(id, orderedIds);

    for (const [index, draft] of drafts.entries()) {
      const imageId = orderedIds[index];

      if (!imageId) continue;

      const caption = draft.caption.trim();

      if (caption) await updateMeasurementImage(id, imageId, { caption });
    }
  };

  const handleSaveClick = () => {
    if (isEdit && totalProducts > 0) {
      setConfirmOpen(true);

      return;
    }

    void submit();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[92vh] max-w-4xl! flex-col gap-4 overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {isEdit
                ? 'ویرایش تصاویر روش اندازه‌گیری'
                : 'تصاویر روش اندازه‌گیری جدید'}
            </DialogTitle>
          </DialogHeader>

          {isEdit && isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              در حال بارگذاری...
            </div>
          ) : (
            <div className="flex-1 space-y-5 overflow-y-auto pl-1">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">نام راهنما</label>

                <Input
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="مثال: روش اندازه‌گیری پیراهن کلاسیک"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">توضیحات (اختیاری)</label>

                <Textarea
                  value={notes}
                  onChange={event => setNotes(event.target.value)}
                  rows={2}
                />
              </div>

              {isEdit && (totalProducts > 0 || totalCategories > 0) && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-6 text-amber-900">
                  این تصاویر به {totalCategories} دسته و {totalProducts} محصول
                  متصل است. برای تغییر محتوای عکس، فایل جدید را جایگزین کنید.
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Images className="size-4" />
                    تصاویر ({images.length})
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      hidden
                      onChange={event => {
                        pickFiles(event.target.files);
                        event.target.value = '';
                      }}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => inputRef.current?.click()}
                    >
                      <ImagePlus className="size-4" />
                      افزودن تصویر
                    </Button>
                  </div>
                </div>

                {!images.length && (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className={cn(
                      'flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5',
                    )}
                  >
                    <UploadCloud className="size-6" />
                    تصاویر روش اندازه‌گیری را اینجا بارگذاری کنید (چند فایل
                    همزمان ممکن است)
                  </button>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="space-y-2 rounded-lg border p-3"
                    >
                      <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt={image.caption || 'روش اندازه‌گیری'}
                          className="size-full object-contain"
                        />

                        <span
                          className={cn(
                            'absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium',
                            image.id
                              ? 'bg-black/60 text-white'
                              : 'bg-emerald-500 text-white',
                          )}
                        >
                          {image.id ? 'ذخیره‌شده' : 'جدید'}
                        </span>
                      </div>

                      <Input
                        value={image.caption}
                        onChange={event =>
                          setImages(previous =>
                            previous.map((item, position) =>
                              position === index
                                ? { ...item, caption: event.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="توضیح تصویر (اختیاری)"
                        className="h-9"
                      />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveImage(index, -1)}
                            disabled={index === 0}
                            className="rounded p-1.5 text-muted-foreground transition hover:bg-muted disabled:opacity-30"
                            aria-label="جابه‌جایی به بالا"
                          >
                            <ArrowUp className="size-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => moveImage(index, 1)}
                            disabled={index === images.length - 1}
                            className="rounded p-1.5 text-muted-foreground transition hover:bg-muted disabled:opacity-30"
                            aria-label="جابه‌جایی به پایین"
                          >
                            <ArrowDown className="size-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer text-xs text-primary hover:underline">
                            تعویض تصویر
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              hidden
                              onChange={event =>
                                replaceImage(index, event.target.files?.[0])
                              }
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="rounded p-1.5 text-muted-foreground transition hover:bg-red-50 hover:text-red-500"
                            aria-label="حذف تصویر"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  فرمت‌های مجاز jpeg، png و webp با حداکثر ۲ مگابایت. نیازی به
                  ویرایش نوشته‌ها و فلش‌های داخل عکس نیست؛ اگر محتوای عکس عوض
                  شد، فایل جدید را جایگزین کنید.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>

            <Button
              type="button"
              onClick={handleSaveClick}
              loading={saveMeasurementGuide.isPending}
            >
              {isEdit ? 'ذخیره تصاویر' : 'ساخت راهنما'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ذخیره تغییرات راهنمای مشترک</AlertDialogTitle>

            <AlertDialogDescription className="leading-7">
              این تصاویر به <b>{totalCategories} دسته</b> و{' '}
              <b>{totalProducts} محصول</b> متصل است. تصویرهای تعویض‌شده روی همه
              آن‌ها نمایش داده می‌شوند.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>

            <AlertDialogAction onClick={() => void submit()}>
              ذخیره می‌کنم
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
