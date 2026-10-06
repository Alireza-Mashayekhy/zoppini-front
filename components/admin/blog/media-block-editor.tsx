'use client';

import { FileVideo, ImagePlus, Loader2, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUploadBlogMedia } from '@/services/features/blog/hooks';

import { SortableItemCard, SortableList } from './sortable';
import { BlockForm, BlockItemForm } from './types';
import { createItem, mediaUrl, moveItem } from './utils';

/** سقف حجم آپلود (هم‌راستا با بک‌اند) */
const MAX_SIZE = {
  image: 5 * 1024 * 1024,
  video: 50 * 1024 * 1024,
};

interface PendingUpload {
  name: string;
  percent: number;
}

/**
 * گالری عکس و فیلم بلوک مدیا.
 *
 * فایل‌ها از سیستم ادمین انتخاب (یا کشیده) می‌شوند، بلافاصله آپلود
 * می‌شوند و به لیست آیتم‌ها اضافه می‌گردند؛ ترتیب با درگ‌دراپ تغییر می‌کند.
 */
export default function MediaBlockEditor({
  block,
  onChange,
}: {
  block: BlockForm;
  onChange: (block: BlockForm) => void;
}) {
  const uploadMutation = useUploadBlogMedia();
  const [pending, setPending] = useState<PendingUpload[]>([]);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const newItems: BlockItemForm[] = [];

      for (const file of files) {
        const kind: 'image' | 'video' = file.type.startsWith('video/')
          ? 'video'
          : 'image';

        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          toast.error(`فرمت «${file.name}» پشتیبانی نمی‌شود`);
          continue;
        }

        if (file.size > MAX_SIZE[kind]) {
          toast.error(
            `حجم «${file.name}» بیشتر از ${MAX_SIZE[kind] / (1024 * 1024)}MB است`,
          );
          continue;
        }

        setPending(current => [...current, { name: file.name, percent: 0 }]);

        try {
          const result = await uploadMutation.mutateAsync({
            file,
            kind,
            onProgress: percent =>
              setPending(current =>
                current.map(item =>
                  item.name === file.name ? { ...item, percent } : item,
                ),
              ),
          });

          newItems.push({
            ...createItem('media'),
            mediaType: kind,
            url: result.url,
            caption: '',
          });
        } catch {
          toast.error(`آپلود «${file.name}» ناموفق بود`);
        } finally {
          setPending(current => current.filter(item => item.name !== file.name));
        }
      }

      if (newItems.length > 0) {
        onChange({ ...block, items: [...block.items, ...newItems] });
      }
    },
    [block, onChange, uploadMutation],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: files => void uploadFiles(files),
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'],
      'video/*': ['.mp4', '.webm', '.ogv'],
    },
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  const updateItem = (
    key: string,
    patch: Partial<BlockForm['items'][number]>,
  ) => {
    onChange({
      ...block,
      items: block.items.map(item =>
        item.key === key ? { ...item, ...patch } : item,
      ),
    });
  };

  const removeItem = (key: string) => {
    onChange({ ...block, items: block.items.filter(item => item.key !== key) });
  };

  /** آپلود پوستر برای ویدیو (تصویر شاخص قبل از پخش) */
  const uploadPoster = async (key: string, file: File) => {
    if (file.size > MAX_SIZE.image) {
      toast.error(`حجم پوستر بیشتر از ${MAX_SIZE.image / (1024 * 1024)}MB است`);
      return;
    }

    setPending(current => [...current, { name: file.name, percent: 0 }]);

    try {
      const result = await uploadMutation.mutateAsync({
        file,
        kind: 'image',
        onProgress: percent =>
          setPending(current =>
            current.map(item =>
              item.name === file.name ? { ...item, percent } : item,
            ),
          ),
      });

      updateItem(key, { poster: result.url });
      toast.success('پوستر ویدیو ثبت شد');
    } catch {
      toast.error('آپلود پوستر ناموفق بود');
    } finally {
      setPending(current => current.filter(item => item.name !== file.name));
    }
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto size-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">
          عکس یا فیلم را اینجا بکشید و رها کنید
        </p>
        <p className="mt-1 text-xs text-gray-400">
          تصویر تا ۵MB (jpg، png، webp، gif) — ویدیو تا ۵۰MB (mp4، webm)
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={open}
        >
          انتخاب از سیستم
        </Button>
      </div>

      {/* وضعیت آپلود فایل‌های در جریان */}
      {pending.map(item => (
        <div
          key={item.name}
          className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600"
        >
          <Loader2 className="size-4 animate-spin" />
          <span className="truncate">{item.name}</span>
          <span className="ms-auto">{item.percent}%</span>
        </div>
      ))}

      {block.items.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
          هنوز فایلی اضافه نشده است.
        </p>
      )}

      <SortableList
        ids={block.items.map(item => item.key)}
        onReorder={(from, to) =>
          onChange({ ...block, items: moveItem(block.items, from, to) })
        }
      >
        {block.items.map(item => (
          <SortableItemCard
            key={item.key}
            id={item.key}
            onRemove={() => removeItem(item.key)}
          >
            <div className="flex flex-wrap items-start gap-3">
              <MediaPreview item={item} />

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {item.mediaType === 'video' ? (
                    <>
                      <FileVideo className="size-4" />
                      ویدیو
                    </>
                  ) : (
                    <>
                      <ImagePlus className="size-4" />
                      تصویر
                    </>
                  )}
                </div>

                <Input
                  value={item.caption ?? ''}
                  onChange={event =>
                    updateItem(item.key, { caption: event.target.value })
                  }
                  placeholder="توضیح زیر فایل (اختیاری)"
                  className="bg-white"
                />

                {item.mediaType === 'video' && (
                  <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                    <ImagePlus className="size-3.5" />
                    {item.poster ? 'تغییر پوستر ویدیو' : 'انتخاب پوستر ویدیو'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={event => {
                        const file = event.target.files?.[0];
                        if (file) void uploadPoster(item.key, file);
                        event.target.value = '';
                      }}
                    />
                  </label>
                )}

                <Input
                  value={item.linkUrl ?? ''}
                  onChange={event =>
                    updateItem(item.key, { linkUrl: event.target.value })
                  }
                  placeholder="لینک (اختیاری، مثلاً /product/category)"
                  className="bg-white"
                />
              </div>
            </div>
          </SortableItemCard>
        ))}
      </SortableList>
    </div>
  );
}

/** پیش‌نمایش فایل (عکس یا ویدیو) */
function MediaPreview({ item }: { item: BlockItemForm }) {
  if (!item.url) return null;

  const src = mediaUrl(item.url);

  if (item.mediaType === 'video') {
    return (
      <video
        src={src}
        poster={item.poster ? mediaUrl(item.poster) : undefined}
        controls
        muted
        playsInline
        preload="metadata"
        className="h-28 w-40 shrink-0 rounded-md border bg-black object-contain"
      />
    );
  }

  return (
    <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-md border">
      <Image src={src} alt={item.caption ?? 'مدیا'} fill className="object-cover" />
    </div>
  );
}
