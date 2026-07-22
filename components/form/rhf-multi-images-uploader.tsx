import { UploadCloud, X } from 'lucide-react';
import Image from 'next/image';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FieldValues, Path, UseFormSetValue } from 'react-hook-form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ImageItem {
  colorId: number;
  file: File;
  preview: string;
}

interface RHFMultiImageUploaderProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  setValue: UseFormSetValue<T>;
  error?: { message?: string };
  colorOptions: { text: string; value: string }[];
  defaultColorId?: number;
  onColorChange?: (colorId: number) => void;
  className?: string;
}

export function RHFMultiImageUploader<T extends FieldValues>({
  name,
  label,
  setValue,
  error,
  colorOptions,
  defaultColorId,
  onColorChange,
  className,
}: RHFMultiImageUploaderProps<T>) {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [selectedColorId, setSelectedColorId] = useState<number>(
    defaultColorId || Number(colorOptions[0]?.value) || 0,
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newItems = acceptedFiles.map(file => ({
        colorId: selectedColorId,
        file,
        preview: URL.createObjectURL(file),
      }));
      const updatedItems = [...items, ...newItems];
      setItems(updatedItems);
      setValue(name, updatedItems as any, { shouldValidate: true });
    },
    [items, selectedColorId, name, setValue],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
  });

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    setValue(name, updatedItems as any, { shouldValidate: true });
  };

  const handleColorChange = (value: string) => {
    const colorId = Number(value);
    setSelectedColorId(colorId);
    if (onColorChange) onColorChange(colorId);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* انتخاب رنگ برای عکس‌های جدید */}
      {colorOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">رنگ برای عکس‌های جدید:</span>
          <Select
            value={selectedColorId.toString()}
            onValueChange={handleColorChange}
            disabled
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="انتخاب رنگ" />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        <div className="text-center">
          <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            {isDragActive
              ? 'فایل را رها کنید...'
              : 'برای آپلود کلیک کنید یا عکس‌ها را بکشید و رها کنید'}
          </p>
          <p className="text-xs text-gray-400">فرمت‌های مجاز: تصاویر</p>
        </div>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {items.map((item, index) => (
            <div key={index} className="relative border rounded-lg p-2">
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600 z-10"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="relative h-24 w-full">
                <Image
                  src={item.preview}
                  alt={`Preview ${index}`}
                  fill
                  className="rounded-md object-contain"
                />
              </div>
              {/* نمایش رنگ انتخاب‌شده برای هر عکس (فقط نمایشی) */}
              <div className="mt-2 text-xs text-gray-500">
                رنگ:{' '}
                {colorOptions.find(c => Number(c.value) === item.colorId)
                  ?.text || 'نامشخص'}
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
