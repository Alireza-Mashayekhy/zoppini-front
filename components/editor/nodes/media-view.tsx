'use client';

import type { ReactNodeViewProps } from '@tiptap/react';
import {
  FileVideo,
  ImageIcon,
  Loader2,
  UploadCloud,
} from 'lucide-react';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

import { normalizeBlockConfig } from '../lib/block-html';
import { MediaBlockConfig, MediaBlockItem } from '../lib/types';
import { uploadEditorFiles } from '../lib/upload';
import { BlockTitleInput, FrameButton } from '../ui/block-frame';
import BlockViewShell from '../ui/block-view-shell';

interface PendingUpload {
  name: string;
  percent: number;
}

/**
 * بلوک گالری عکس و فیلم — داخل خود متن مقاله.
 *
 * فایل‌ها با کشیدن‌رهاکردن یا انتخاب از سیستم آپلود می‌شوند؛ برای هر
 * فایل توضیح، لینک و (برای ویدیو) پوستر قابل تنظیم است.
 */
export default function MediaNodeView(view: ReactNodeViewProps) {
  const config = normalizeBlockConfig('media', view.node.attrs.config);
  const items = config.items;

  const [pending, setPending] = useState<PendingUpload[]>([]);

  const update = (patch: Partial<MediaBlockConfig>) =>
    view.updateAttributes({ config: { ...config, ...patch } });

  const updateItems = (next: MediaBlockItem[]) => update({ items: next });

  const addFiles = async (files: File[]) => {
    setPending(current => [
      ...current,
      ...files.map(file => ({ name: file.name, percent: 0 })),
    ]);

    const uploaded = await uploadEditorFiles(files, (file, percent) =>
      setPending(current =>
        current.map(item => (item.name === file.name ? { ...item, percent } : item)),
      ),
    );

    setPending(current =>
      current.filter(item => !files.some(file => file.name === item.name)),
    );

    if (uploaded.length === 0) return;

    updateItems([
      ...items,
      ...uploaded.map(file => ({
        mediaType: file.kind,
        url: file.url,
        caption: '',
      })),
    ]);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: files => void addFiles(files),
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'],
      'video/*': ['.mp4', '.webm', '.ogv', '.m4v'],
    },
    multiple: true,
    noClick: true,
    noKeyboard: true,
  });

  const updateItem = (index: number, patch: Partial<MediaBlockItem>) =>
    updateItems(
      items.map((item, current) => (current === index ? { ...item, ...patch } : item)),
    );

  const removeItem = (index: number) =>
    updateItems(items.filter((_, current) => current !== index));

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);

    updateItems(next);
  };

  /** آپلود پوستر ویدیو (تصویر شاخص پیش از پخش) */
  const uploadPoster = async (index: number, file: File) => {
    setPending(current => [...current, { name: file.name, percent: 0 }]);

    const [uploaded] = await uploadEditorFiles([file], (posterFile, percent) =>
      setPending(current =>
        current.map(item =>
          item.name === posterFile.name ? { ...item, percent } : item,
        ),
      ),
    );

    setPending(current => current.filter(item => item.name !== file.name));

    if (uploaded) updateItem(index, { poster: uploaded.url });
  };

  return (
    <BlockViewShell
      kind="media"
      view={view}
      icon={<ImageIcon className="size-3.5" />}
      header={
        <BlockTitleInput
          value={config.title ?? ''}
          onChange={title => update({ title })}
          placeholder="عنوان گالری (اختیاری)"
        />
      }
    >
      <div className="space-y-3">
        <div
          {...getRootProps()}
          className={cn(
            'rounded border-2 border-dashed p-4 text-center transition-colors',
            isDragActive
              ? 'border-neutral-900 bg-neutral-50'
              : 'border-neutral-300 hover:border-neutral-400',
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto size-7 text-neutral-400" />
          <p className="mt-2 text-xs text-neutral-600">
            عکس یا فیلم را اینجا بکشید و رها کنید
          </p>
          <p className="mt-1 text-[11px] text-neutral-400">
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

        {pending.map(item => (
          <div
            key={item.name}
            className="flex items-center gap-2 rounded bg-neutral-50 px-3 py-2 text-[11px] text-neutral-600"
          >
            <Loader2 className="size-3.5 animate-spin" />
            <span className="truncate">{item.name}</span>
            <span className="ms-auto">{item.percent}%</span>
          </div>
        ))}

        {items.length === 0 ? (
          <p className="rounded border border-dashed border-neutral-300 p-4 text-center text-xs text-neutral-500">
            هنوز فایلی اضافه نشده است.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={`${item.url}-${index}`}
                className="flex items-start gap-3 rounded border border-neutral-100 bg-neutral-50/60 p-2"
              >
                <MediaPreview item={item} />

                <div className="min-w-0 flex-1 space-y-2">
                  <span className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                    {item.mediaType === 'video' ? (
                      <FileVideo className="size-3.5" />
                    ) : (
                      <ImageIcon className="size-3.5" />
                    )}
                    فایل {index + 1}
                  </span>

                  <Input
                    value={item.caption ?? ''}
                    onChange={event => updateItem(index, { caption: event.target.value })}
                    placeholder="توضیح زیر فایل (اختیاری)"
                    className="h-8 bg-white text-xs"
                  />

                  <Input
                    value={item.linkUrl ?? ''}
                    onChange={event => updateItem(index, { linkUrl: event.target.value })}
                    placeholder="لینک (اختیاری، مثلاً /product/category)"
                    className="h-8 bg-white text-xs"
                  />

                  {item.mediaType === 'image' && (
                    <Input
                      value={item.alt ?? ''}
                      onChange={event => updateItem(index, { alt: event.target.value })}
                      placeholder="متن جایگزین (برای سئو)"
                      className="h-8 bg-white text-xs"
                    />
                  )}

                  {item.mediaType === 'video' && (
                    <label className="flex w-fit cursor-pointer items-center gap-2 rounded border px-2.5 py-1.5 text-[11px] text-neutral-600 transition-colors hover:bg-white">
                      <ImageIcon className="size-3.5" />
                      {item.poster ? 'تغییر پوستر ویدیو' : 'انتخاب پوستر ویدیو'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={event => {
                          const file = event.target.files?.[0];
                          if (file) void uploadPoster(index, file);
                          event.target.value = '';
                        }}
                      />
                    </label>
                  )}
                </div>

                <div className="flex shrink-0 flex-col">
                  <FrameButton
                    title="انتقال به بالا"
                    disabled={index === 0}
                    onClick={() => moveItem(index, -1)}
                  >
                    <span className="text-[10px]">▲</span>
                  </FrameButton>
                  <FrameButton
                    title="انتقال به پایین"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, 1)}
                  >
                    <span className="text-[10px]">▼</span>
                  </FrameButton>
                  <FrameButton
                    title="حذف فایل"
                    tone="danger"
                    onClick={() => removeItem(index)}
                  >
                    <span className="text-[10px]">✕</span>
                  </FrameButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </BlockViewShell>
  );
}

/** پیش‌نمایش کوچک فایل (عکس یا ویدیو) */
function MediaPreview({ item }: { item: MediaBlockItem }) {
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
        className="h-24 w-36 shrink-0 rounded border bg-black object-contain"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={item.alt || item.caption || 'مدیا'}
      className="h-24 w-36 shrink-0 rounded border object-cover"
    />
  );
}
