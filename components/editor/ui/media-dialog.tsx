'use client';

import { FileVideo, GalleryHorizontal, ImageIcon, Loader2, Plus, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

import { uploadEditorFiles } from '../lib/upload';

/**
 * پنجره‌ی درج رسانه.
 *
 * یک پنجره برای هر سه حالت (تصویر، ویدیو و گالری) با دو راه: آپلود از
 * سیستم (کشیدن‌رهاکردن هم کار می‌کند) یا آدرس اینترنتی.
 */

export type MediaDialogMode = 'image' | 'video' | 'gallery';

export interface MediaEntry {
  kind: 'image' | 'video';
  /** مسیر نسبی فایل آپلودشده یا آدرس کامل خارجی */
  src: string;
  poster?: string;
}

const MODE_TITLES: Record<MediaDialogMode, string> = {
  image: 'درج تصویر',
  video: 'درج ویدیو',
  gallery: 'درج گالری عکس و فیلم',
};

const ACCEPT: Record<MediaDialogMode, Record<string, string[]>> = {
  image: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'] },
  video: { 'video/*': ['.mp4', '.webm', '.ogv', '.m4v'] },
  gallery: {
    'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'],
    'video/*': ['.mp4', '.webm', '.ogv', '.m4v'],
  },
};

interface PendingFile {
  name: string;
  percent: number;
}

export default function MediaDialog({
  open,
  onOpenChange,
  mode,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: MediaDialogMode;
  onConfirm: (entries: MediaEntry[]) => void;
}) {
  const [entries, setEntries] = useState<MediaEntry[]>([]);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [tab, setTab] = useState<'upload' | 'url'>('upload');

  const reset = () => {
    setEntries([]);
    setPending([]);
    setRemoteUrl('');
    setTab('upload');
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

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

    if (uploaded.length > 0) {
      setEntries(current => [
        ...current,
        ...uploaded.map(file => ({ kind: file.kind, src: file.url })),
      ]);
    }
  };

  const { getRootProps, getInputProps, isDragActive, open: openPicker } =
    useDropzone({
      onDrop: files => void handleFiles(files),
      accept: ACCEPT[mode],
      multiple: mode === 'gallery',
      noClick: true,
      noKeyboard: true,
    });

  const addRemote = () => {
    const url = remoteUrl.trim();
    if (!url) return;

    const kind: 'image' | 'video' =
      mode === 'video' || /\.(mp4|webm|ogv|m4v)(\?.*)?$/i.test(url)
        ? 'video'
        : 'image';

    setEntries(current => [...current, { kind, src: url }]);
    setRemoteUrl('');
  };

  const confirm = () => {
    if (entries.length === 0) return;

    onConfirm(mode === 'video' ? entries.filter(entry => entry.kind === 'video') : entries);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {mode === 'image' && <ImageIcon className="size-4" />}
            {mode === 'video' && <FileVideo className="size-4" />}
            {mode === 'gallery' && <GalleryHorizontal className="size-4" />}
            {MODE_TITLES[mode]}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={value => setTab(value as 'upload' | 'url')}>
          <TabsList className="w-fit">
            <TabsTrigger value="upload">آپلود از سیستم</TabsTrigger>
            <TabsTrigger value="url">آدرس اینترنتی</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-3">
            <div
              {...getRootProps()}
              className={cn(
                'rounded border-2 border-dashed p-5 text-center transition-colors',
                isDragActive
                  ? 'border-neutral-900 bg-neutral-50'
                  : 'border-neutral-300 hover:border-neutral-400',
              )}
            >
              <input {...getInputProps()} />
              <UploadCloud className="mx-auto size-7 text-neutral-400" />
              <p className="mt-2 text-sm text-neutral-600">
                فایل را اینجا بکشید و رها کنید
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                تصویر تا ۵MB — ویدیو تا ۵۰MB
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={openPicker}
              >
                انتخاب فایل
              </Button>
            </div>

            {pending.map(item => (
              <div
                key={item.name}
                className="flex items-center gap-2 rounded bg-neutral-50 px-3 py-2 text-xs text-neutral-600"
              >
                <Loader2 className="size-3.5 animate-spin" />
                <span className="truncate">{item.name}</span>
                <span className="ms-auto">{item.percent}%</span>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="url" className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={remoteUrl}
                dir="ltr"
                placeholder="https://example.com/image.jpg"
                onChange={event => setRemoteUrl(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addRemote();
                  }
                }}
                className="h-9 bg-white text-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={addRemote}>
                <Plus className="size-3.5" />
                افزودن
              </Button>
            </div>
            <p className="text-[11px] text-neutral-400">
              برای فایل‌های آپلودشده در همین سایت، مسیر نسبی (مثل
              images/x.webp) هم قبول می‌شود.
            </p>
          </TabsContent>
        </Tabs>

        {entries.length > 0 && (
          <ul className="flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
            {entries.map((entry, index) => (
              <li key={`${entry.src}-${index}`} className="relative">
                {entry.kind === 'video' ? (
                  <video
                    src={mediaUrl(entry.src)}
                    controls
                    muted
                    playsInline
                    preload="metadata"
                    className="h-20 w-32 rounded border bg-black object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(entry.src)}
                    alt=""
                    className="h-20 w-32 rounded border object-cover"
                  />
                )}

                <button
                  type="button"
                  title="حذف"
                  onClick={() =>
                    setEntries(current => current.filter((_, item) => item !== index))
                  }
                  className="absolute -top-2 -left-2 flex size-5 items-center justify-center rounded-full bg-neutral-900 text-white"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleOpenChange(false)}
          >
            انصراف
          </Button>
          <Button
            type="button"
            variant="dark"
            size="sm"
            disabled={entries.length === 0 || pending.length > 0}
            onClick={confirm}
          >
            درج در مقاله
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
