'use client';

import type { ReactNodeViewProps } from '@tiptap/react';
import { FileVideo, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Switch } from '@/components/ui/switch';
import { mediaUrl } from '@/lib/media';

import { MediaNodeAttrs } from '../lib/media-attrs';
import { uploadEditorFile } from '../lib/upload';
import MediaFrame from '../ui/media-frame';

/**
 * نمای نود ویدیو در پنل ادمین.
 *
 * ویدیو با کنترل پخش نمایش داده می‌شود و پوستر، پخش خودکار، بی‌صدا و
 * تکرار هم از همین‌جا تنظیم می‌شوند.
 */
export default function VideoNodeView(view: ReactNodeViewProps) {
  const attrs = view.node.attrs as MediaNodeAttrs;
  const [uploading, setUploading] = useState<'video' | 'poster' | null>(null);

  const pickFile = async (kind: 'video' | 'poster', file?: File) => {
    if (!file) return;

    setUploading(kind);
    const uploaded = await uploadEditorFile(file);
    setUploading(null);

    if (!uploaded) return;

    view.updateAttributes(
      kind === 'poster' ? { poster: uploaded.url } : { src: uploaded.url },
    );
  };

  return (
    <MediaFrame
      view={view}
      kind="video"
      extraSettings={
        <>
          <label className="flex w-fit cursor-pointer items-center gap-2 rounded border px-2.5 py-1.5 text-[11px] text-neutral-600 transition-colors hover:bg-white">
            {uploading === 'poster' ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileVideo className="size-3.5" />
            )}
            {attrs.poster ? 'تغییر پوستر ویدیو' : 'انتخاب پوستر ویدیو'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={event => {
                void pickFile('poster', event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </label>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-neutral-600">
              <Switch
                checked={!!attrs.autoplay}
                onCheckedChange={checked => view.updateAttributes({ autoplay: checked })}
              />
              پخش خودکار
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-neutral-600">
              <Switch
                checked={attrs.muted !== false}
                onCheckedChange={checked => view.updateAttributes({ muted: checked })}
              />
              بی‌صدا
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-[11px] text-neutral-600">
              <Switch
                checked={!!attrs.loop}
                onCheckedChange={checked => view.updateAttributes({ loop: checked })}
              />
              تکرار
            </label>
          </div>
        </>
      }
    >
      {attrs.src ? (
        <video
          src={mediaUrl(attrs.src)}
          poster={attrs.poster ? mediaUrl(attrs.poster) : undefined}
          controls
          playsInline
          preload="metadata"
          muted={attrs.muted !== false}
          loop={!!attrs.loop}
          className="zp-figure__video"
        />
      ) : (
        <label className="zp-figure__empty">
          {uploading === 'video' ? (
            <Loader2 className="size-5 animate-spin text-neutral-400" />
          ) : (
            <FileVideo className="size-5 text-neutral-400" />
          )}
          <span className="text-xs text-neutral-500">انتخاب ویدیو</span>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={event => {
              void pickFile('video', event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>
      )}
    </MediaFrame>
  );
}
