'use client';

import { UploadCloud, X } from 'lucide-react';
import Image from 'next/image';
import React, { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FieldValues, Path, PathValue, UseFormSetValue } from 'react-hook-form';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';

/** هر آیتم فرم: یا فایل تازه انتخاب‌شده یا آدرس (رشته) عکس فعلی که نگه داشته شده */
export type SecondImageFormItem = File | string;

interface ImageItem {
  key: string;
  file?: File;
  url?: string;
  preview: string;
}

interface RHFSecondImagesUploaderProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  setValue: UseFormSetValue<T>;
  error?: { message?: string };
  /** آدرس کامل عکس‌های فعلی (حالت ویرایش) */
  defaultValues?: string[];
  /** فرمت‌های مجاز با کاما جدا شوند */
  accept?: string;
  /** حداکثر حجم هر فایل (بایت) */
  maxSize?: number;
  /** حداکثر تعداد عکس */
  maxFiles?: number;
  className?: string;
}

export const SECOND_IMAGES_MAX_SIZE = 2 * 1024 * 1024;
export const SECOND_IMAGES_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export function RHFSecondImagesUploader<T extends FieldValues>({
  name,
  label,
  setValue,
  error,
  defaultValues = [],
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = SECOND_IMAGES_MAX_SIZE,
  maxFiles = 2,
  className,
}: RHFSecondImagesUploaderProps<T>) {
  // مقدار اولیه از عکس‌های فعلی (حالت ویرایش) گرفته می‌شود؛ والد با تغییر
  // دسته‌بندی انتخابی این کامپوننت را از طریق `key` دوباره مونت می‌کند.
  const [items, setItems] = useState<ImageItem[]>(() =>
    defaultValues
      .slice(0, maxFiles)
      .map(url => ({ key: url, url, preview: url })),
  );

  const acceptMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    accept.split(',').forEach(type => {
      const trimmed = type.trim();
      if (trimmed) map[trimmed] = [];
    });
    return map;
  }, [accept]);

  const syncFormValue = useCallback(
    (list: ImageItem[]) => {
      const value: SecondImageFormItem[] = list.map(item =>
        item.file ? item.file : (item.url ?? item.preview),
      );
      setValue(name, value as PathValue<T, Path<T>>, { shouldValidate: true });
    },
    [name, setValue],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const next = [...items];
      let overflowed = false;

      for (const file of acceptedFiles) {
        if (next.length >= maxFiles) {
          overflowed = true;
          continue;
        }

        if (file.size > maxSize) {
          toast.error(
            `حجم فایل «${file.name}» بیش از ${maxSize / 1024 / 1024} مگابایت است.`,
          );
          continue;
        }

        if (!SECOND_IMAGES_ACCEPTED_TYPES.includes(file.type)) {
          toast.error(
            `فرمت فایل «${file.name}» مجاز نیست. فقط jpeg / png / webp.`,
          );
          continue;
        }

        next.push({
          key: `file-${Date.now()}-${next.length}-${file.name}`,
          file,
          preview: URL.createObjectURL(file),
        });
      }

      if (overflowed) {
        toast.error(`حداکثر ${maxFiles} تصویر دوم برای هر دسته‌بندی مجاز است.`);
      }

      setItems(next);
      syncFormValue(next);
    },
    [items, maxFiles, maxSize, syncFormValue],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptMap,
    multiple: maxFiles > 1,
  });

  const removeItem = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    const next = items.filter(item => item.key !== key);
    setItems(next);
    syncFormValue(next);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {items.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors',
            isDragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
              : 'border-gray-300 dark:border-gray-700 hover:border-primary-400',
            error?.message && 'border-red-500 dark:border-red-500',
          )}
        >
          <input {...getInputProps()} />

          <div className="text-center">
            <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              {isDragActive ? (
                <span>فایل را رها کنید...</span>
              ) : (
                <span>برای آپلود کلیک کنید یا عکس‌ها را بکشید و رها کنید</span>
              )}
            </p>
            <p className="text-xs text-gray-400">
              فرمت‌های مجاز: jpeg / png / webp – حداکثر {maxSize / 1024 / 1024}
              MB برای هر عکس (حداکثر {maxFiles} عکس)
            </p>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, index) => (
            <div
              key={item.key}
              className="relative rounded-lg border border-gray-200 p-2"
            >
              <button
                type="button"
                onClick={e => removeItem(e, item.key)}
                className="absolute -right-2 -top-2 z-10 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative aspect-square w-full">
                <Image
                  src={item.preview}
                  alt={`تصویر دوم ${index + 1}`}
                  fill
                  className="rounded-md object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {error?.message && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      )}
    </div>
  );
}
