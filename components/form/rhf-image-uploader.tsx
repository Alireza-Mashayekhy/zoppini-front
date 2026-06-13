// components/form/rhf-image-uploader.tsx
import { UploadCloud, X } from 'lucide-react';
import Image from 'next/image';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FieldValues, Path, PathValue, UseFormSetValue } from 'react-hook-form';

import { cn } from '@/lib/utils';

interface RHFImageUploaderProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  setValue: UseFormSetValue<T>;
  error?: { message?: string };
  defaultValue?: string | null;
  accept?: string;
  maxSize?: number;
  aspectRatio?: number;
  className?: string;
}

export function RHFImageUploader<T extends FieldValues>({
  name,
  label,
  setValue,
  error,
  defaultValue = null,
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 2 * 1024 * 1024,
  aspectRatio,
  className,
}: RHFImageUploaderProps<T>) {
  // مقدار اولیه preview همان defaultValue است
  const [preview, setPreview] = useState<string | null>(defaultValue);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      if (!selectedFile) return;

      // اعتبارسنجی حجم
      if (selectedFile.size > maxSize) {
        setValue(name, undefined as any, { shouldValidate: true });
        setPreview(null);
        return;
      }

      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
      setValue(name, selectedFile as PathValue<T, Path<T>>, {
        shouldValidate: true,
      });
    },
    [maxSize, name, setValue],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    maxFiles: 1,
    multiple: false,
  });

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setValue(name, undefined as any, { shouldValidate: true });
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

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

        {preview ? (
          <div className="relative h-48 w-full">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="rounded-md object-contain"
              style={{ aspectRatio: aspectRatio ? aspectRatio : 'auto' }}
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              {isDragActive ? (
                <span>فایل را رها کنید...</span>
              ) : (
                <span>برای آپلود کلیک کنید یا عکس را بکشید و رها کنید</span>
              )}
            </p>
            <p className="text-xs text-gray-400">
              فرمت‌های مجاز: {accept} – حداکثر {maxSize / 1024 / 1024}MB
            </p>
          </div>
        )}
      </div>

      {error?.message && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      )}
    </div>
  );
}
