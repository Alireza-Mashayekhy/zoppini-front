'use client';

import type { ReactNodeViewProps } from '@tiptap/react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { mediaUrl } from '@/lib/media';

import { MediaNodeAttrs } from '../lib/media-attrs';
import { uploadEditorFile } from '../lib/upload';
import MediaFrame from '../ui/media-frame';

/**
 * نمای نود تصویر در پنل ادمین.
 *
 * تصویر با آدرس کامل نمایش داده می‌شود ولی در متن همان مسیر نسبی
 * ذخیره می‌ماند؛ بقیه‌ی کنترل‌ها (عرض، چینش، لینک، توضیح، درگ) در
 * `MediaFrame` مشترک است.
 */
export default function ImageNodeView(view: ReactNodeViewProps) {
  const attrs = view.node.attrs as MediaNodeAttrs;
  const [uploading, setUploading] = useState(false);

  const pickFile = async (file?: File) => {
    if (!file) return;

    setUploading(true);
    const uploaded = await uploadEditorFile(file);
    setUploading(false);

    if (uploaded) view.updateAttributes({ src: uploaded.url });
  };

  return (
    <MediaFrame
      view={view}
      kind="image"
      extraSettings={
        <>
          <label className="block space-y-1">
            <span className="text-[11px] text-neutral-500">
              متن جایگزین (alt — برای سئو)
            </span>
            <Input
              value={attrs.alt ?? ''}
              onChange={event => view.updateAttributes({ alt: event.target.value })}
              placeholder="توصیف کوتاه تصویر"
              className="h-8 bg-white text-xs"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] text-neutral-500">
              عنوان (tooltip روی تصویر)
            </span>
            <Input
              value={attrs.title ?? ''}
              onChange={event => view.updateAttributes({ title: event.target.value })}
              placeholder="اختیاری"
              className="h-8 bg-white text-xs"
            />
          </label>
        </>
      }
    >
      {attrs.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(attrs.src)}
          alt={attrs.alt ?? ''}
          title={attrs.title || undefined}
          className="zp-figure__image"
        />
      ) : (
        <label className="zp-figure__empty">
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-neutral-400" />
          ) : (
            <ImageIcon className="size-5 text-neutral-400" />
          )}
          <span className="text-xs text-neutral-500">انتخاب تصویر</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={event => {
              void pickFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>
      )}
    </MediaFrame>
  );
}
