'use client';

import {
  ImageIcon,
  InfoIcon,
  RotateCcwIcon,
  SaveIcon,
  Trash2Icon,
  UploadCloudIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { HOME_IMAGE_SLOTS, HomeImageSlot } from '@/lib/home-images';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import {
  useAdminSiteImages,
  useResetSiteImage,
  useUpdateSiteImage,
} from '@/services/features/site-images/hooks';
import { AdminSiteImageResponse } from '@/services/features/site-images/types';

const ACCEPTED_TYPES = 'image/webp,image/png,image/jpeg,image/avif,image/gif';

/**
 * پیش‌نمایش فایل انتخاب‌شده و آزادکردن حافظه‌ی آن
 * (چون `URL.createObjectURL` باید revoke شود).
 */
function useObjectUrl(file?: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!url) return;

    return () => URL.revokeObjectURL(url);
  }, [url]);

  return url;
}

/** انتخاب فایل تصویر با پیش‌نمایش */
function ImageFileField({
  label,
  hint,
  currentUrl,
  file,
  required,
  onChange,
}: {
  label: string;
  hint: string;
  currentUrl?: string | null;
  file?: File | null;
  required?: boolean;
  onChange: (file: File | null) => void;
}) {
  const objectUrl = useObjectUrl(file);
  const preview = objectUrl ?? currentUrl ?? null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>

        <Badge variant={required ? 'secondary' : 'outline'}>
          {required ? 'الزامی' : 'اختیاری'}
        </Badge>
      </div>

      <label
        className={cn(
          'relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-muted/35 transition-colors hover:border-primary/60',
          objectUrl && 'border-primary/60',
        )}
      >
        <input
          type="file"
          accept={ACCEPTED_TYPES}
          className="sr-only"
          onChange={event => {
            const selected = event.target.files?.[0] ?? null;
            onChange(selected);
            // اجازه می‌دهد همان فایل دوباره انتخاب شود
            event.target.value = '';
          }}
        />

        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={label}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 p-4 text-center text-muted-foreground">
            <UploadCloudIcon className="size-6" />
            <span className="text-xs">برای انتخاب تصویر کلیک کنید</span>
          </div>
        )}

        {objectUrl && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-[11px] text-white">
            انتخاب جدید — هنوز ذخیره نشده
          </span>
        )}
      </label>

      <p className="text-xs text-muted-foreground">{hint}</p>

      {file && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(null)}
        >
          <RotateCcwIcon />
          لغو انتخاب این تصویر
        </Button>
      )}
    </div>
  );
}

/** کارت مدیریت یک جایگاه تصویر */
function HomeImageCard({
  slot,
  record,
}: {
  slot: HomeImageSlot;
  record: AdminSiteImageResponse | null;
}) {
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [alt, setAlt] = useState(record?.alt ?? '');
  const [linkUrl, setLinkUrl] = useState(record?.linkUrl ?? '');
  const [isActive, setIsActive] = useState(record?.isActive ?? true);

  const updateMutation = useUpdateSiteImage();
  const resetMutation = useResetSiteImage();

  const desktopUrl = record?.desktop ? mediaUrl(record.desktop) : null;
  const mobileUrl = record?.mobile ? mediaUrl(record.mobile) : null;

  const isFirstUpload = !record?.desktop;

  const handleSave = async () => {
    if (isFirstUpload && !desktopFile) {
      toast.error('ابتدا تصویر دسکتاپ را انتخاب کنید');

      return;
    }

    try {
      await updateMutation.mutateAsync({
        slot: slot.key,
        dto: {
          desktop: desktopFile,
          mobile: mobileFile,
          alt,
          linkUrl: slot.supportsLink ? linkUrl : '',
          isActive,
        },
      });

      setDesktopFile(null);
      setMobileFile(null);

      toast.success(`«${slot.label}» ذخیره شد`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'ذخیره‌ی تصویر انجام نشد');
    }
  };

  const handleRemoveMobile = async () => {
    try {
      await updateMutation.mutateAsync({
        slot: slot.key,
        dto: { removeMobile: true },
      });

      setMobileFile(null);

      toast.success(
        'تصویر موبایل حذف شد؛ روی موبایل همان تصویر دسکتاپ نمایش داده می‌شود',
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'حذف تصویر موبایل انجام نشد',
      );
    }
  };

  const handleReset = async () => {
    try {
      await resetMutation.mutateAsync(slot.key);

      setDesktopFile(null);
      setMobileFile(null);
      setAlt(slot.defaultAlt);
      setLinkUrl(slot.defaultLink ?? '');
      setIsActive(true);

      toast.success('تصویر پیش‌فرض سایت بازگشت');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'حذف تصویر انجام نشد');
    }
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{slot.label}</h3>

            {record?.desktop ? (
              <Badge variant="secondary">تصویر سفارشی</Badge>
            ) : (
              <Badge variant="outline">تصویر پیش‌فرض سایت</Badge>
            )}

            {record?.desktop && !record.isActive && (
              <Badge variant="destructive">
                خاموش — پیش‌فرض نمایش داده می‌شود
              </Badge>
            )}
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            {slot.description}
          </p>
        </div>

        {record?.desktop && (
          <label className="flex items-center gap-2 text-xs">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            نمایش تصویر آپلودی
          </label>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ImageFileField
          label="تصویر دسکتاپ"
          hint={`اندازه‌ی پیشنهادی: ${slot.desktopSize} — حداکثر ۵ مگابایت (webp/jpg/png)`}
          currentUrl={desktopUrl}
          file={desktopFile}
          required={isFirstUpload}
          onChange={setDesktopFile}
        />

        <ImageFileField
          label="تصویر موبایل"
          hint={
            slot.visibleOnMobile
              ? `اندازه‌ی پیشنهادی: ${slot.mobileSize} — اگر آپلود نکنید، همان تصویر دسکتاپ روی موبایل نمایش داده می‌شود.`
              : 'این جایگاه در موبایل نمایش داده نمی‌شود؛ خالی بگذارید.'
          }
          currentUrl={mobileUrl}
          file={mobileFile}
          onChange={setMobileFile}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">متن جایگزین (alt)</label>

          <Input
            value={alt}
            onChange={event => setAlt(event.target.value)}
            placeholder={slot.defaultAlt}
            maxLength={255}
          />

          <p className="text-xs text-muted-foreground">
            برای سئو و دسترس‌پذیری؛ اگر خالی بماند «{slot.defaultAlt}» استفاده
            می‌شود.
          </p>
        </div>

        {slot.supportsLink && (
          <div className="space-y-2">
            <label className="text-sm font-medium">لینک کلیک</label>

            <Input
              value={linkUrl}
              onChange={event => setLinkUrl(event.target.value)}
              placeholder={slot.defaultLink ?? '/products'}
              dir="ltr"
            />

            <p className="text-xs text-muted-foreground">
              مسیر داخلی (مثل <span dir="ltr">/products</span>) یا آدرس کامل
              http(s). خالی بماند، لینک پیش‌فرض استفاده می‌شود.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
        <Button
          type="button"
          onClick={handleSave}
          loading={updateMutation.isPending}
        >
          <SaveIcon />
          ذخیره
        </Button>

        {record?.mobile && (
          <Button
            type="button"
            variant="outline"
            onClick={handleRemoveMobile}
            disabled={updateMutation.isPending}
          >
            <Trash2Icon />
            حذف تصویر موبایل
          </Button>
        )}

        {record?.desktop && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={resetMutation.isPending}
              >
                <RotateCcwIcon />
                بازگشت به تصویر پیش‌فرض
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  بازگشت «{slot.label}» به تصویر پیش‌فرض؟
                </AlertDialogTitle>

                <AlertDialogDescription>
                  تصویرهای آپلودشده‌ی این جایگاه حذف می‌شوند و سایت همان تصویر
                  پیش‌فرض قبلی را نمایش می‌دهد. این کار قابل بازگشت نیست.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>انصراف</AlertDialogCancel>

                <AlertDialogAction onClick={handleReset}>
                  بله، حذف کن
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

/** لیست کامل جایگاه‌های تصویر صفحه اصلی */
export default function HomeImagesManager() {
  const { data, isLoading } = useAdminSiteImages();

  const records = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
        <InfoIcon className="mt-0.5 size-4 shrink-0" />

        <p>
          تصویر موبایل اختیاری است؛ هر جایگاهی که تصویر موبایل نداشته باشد، روی
          موبایل همان تصویر دسکتاپ را نشان می‌دهد. تغییرات حداکثر چند دقیقه بعد
          (پس از بازسازی صفحه اصلی) روی سایت دیده می‌شود.
        </p>
      </div>

      {HOME_IMAGE_SLOTS.map(slot => (
        <HomeImageCard
          key={`${slot.key}-${records.find(r => r.slot === slot.key)?.updatedAt ?? 'none'}`}
          slot={slot}
          record={records.find(record => record.slot === slot.key) ?? null}
        />
      ))}

      {HOME_IMAGE_SLOTS.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
          <ImageIcon className="size-6" />
          جایگاهی برای تصاویر صفحه اصلی تعریف نشده است.
        </div>
      )}
    </div>
  );
}
