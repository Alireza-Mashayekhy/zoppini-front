'use client';

import type { ReactNodeViewProps } from '@tiptap/react';
import { NodeViewWrapper, useReactNodeView } from '@tiptap/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  Loader2,
  Replace,
  Settings2,
  Trash2,
} from 'lucide-react';
import { ReactNode, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import {
  clampWidth,
  MEDIA_WIDTH_PRESETS,
  MediaAlign,
  MediaNodeAttrs,
} from '../lib/media-attrs';
import {
  canMoveNode,
  duplicateNode,
  moveNodeVertically,
  selectNode,
} from '../lib/node-actions';
import { uploadEditorFile } from '../lib/upload';

/**
 * قاب مشترک نودهای رسانه (تصویر و ویدیو).
 *
 * همه‌ی کنترل‌ها — درگ، تغییر عرض، چینش، جایگزینی فایل، توضیح و لینک —
 * یک‌جا پیاده شده‌اند تا رفتار تصویر و ویدیو دقیقاً مثل هم باشد.
 */
export default function MediaFrame({
  view,
  kind,
  children,
  extraSettings,
}: {
  view: ReactNodeViewProps;
  kind: 'image' | 'video';
  /** خود عنصر رسانه (تصویر یا ویدیو) */
  children: ReactNode;
  /** فیلدهای اختصاصی هر نوع رسانه در پنل تنظیمات */
  extraSettings?: ReactNode;
}) {
  const { onDragStart } = useReactNodeView();
  const { editor, getPos, node, selected, updateAttributes, deleteNode, HTMLAttributes } = view;

  const attrs = node.attrs as MediaNodeAttrs;
  const align = (attrs.align ?? 'center') as MediaAlign;

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [resizeWidth, setResizeWidth] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const width = resizeWidth ?? attrs.width ?? null;

  const update = (patch: Partial<MediaNodeAttrs>) => updateAttributes(patch);

  /** تغییر عرض با کشیدن لبه‌ی تصویر (مثل گوتنبرگ) */
  const startResize = (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const containerWidth = editor.view.dom.clientWidth || 1;
    const startWidthPx = stageRef.current?.offsetWidth ?? containerWidth;
    const startX = event.clientX;
    const isRtl =
      getComputedStyle(editor.view.dom).direction === 'rtl' ||
      document.dir === 'rtl';

    const handleMove = (moveEvent: PointerEvent) => {
      const delta = (moveEvent.clientX - startX) * (isRtl ? -1 : 1);
      const percent = clampWidth(((startWidthPx + delta) / containerWidth) * 100);

      setResizeWidth(percent);
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);

      setResizeWidth(current => {
        if (current !== null) update({ width: current });
        return null;
      });
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  /** جایگزینی فایل با یک فایل تازه از سیستم */
  const replaceFile = async (file?: File) => {
    if (!file) return;

    setReplacing(true);
    const uploaded = await uploadEditorFile(file);
    setReplacing(false);

    if (!uploaded) return;

    update({ src: uploaded.url });
  };

  const { class: serializedClass, ...attributes } = (HTMLAttributes ?? {}) as Record<
    string,
    unknown
  >;

  return (
    <NodeViewWrapper
      as="figure"
      {...attributes}
      className={cn(
        serializedClass as string,
        'zp-figure',
        `zp-figure--${kind}`,
        `is-align-${align}`,
        selected && 'is-selected',
      )}
      style={{ width: width ? `${width}%` : undefined }}
    >
      <div className="zp-figure__bar" data-visible={selected || undefined}>
        <span
          data-drag-handle
          draggable
          onDragStart={event => {
            event.stopPropagation();
            onDragStart?.(event.nativeEvent);
          }}
          title="گرفتن و جابه‌جا کردن"
          className="flex cursor-grab touch-none items-center rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </span>

        <span className="me-1 text-[11px] text-neutral-500">
          {kind === 'image' ? 'تصویر' : 'ویدیو'}
        </span>

        <span className="mx-1 h-4 w-px bg-neutral-200" />

        <FrameButton
          title="انتقال به بالا"
          disabled={!canMoveNode(editor, getPos, -1)}
          onClick={() => moveNodeVertically(editor, getPos, -1)}
        >
          <ArrowUp className="size-3.5" />
        </FrameButton>
        <FrameButton
          title="انتقال به پایین"
          disabled={!canMoveNode(editor, getPos, 1)}
          onClick={() => moveNodeVertically(editor, getPos, 1)}
        >
          <ArrowDown className="size-3.5" />
        </FrameButton>
        <FrameButton title="کپی" onClick={() => duplicateNode(editor, getPos)}>
          <Copy className="size-3.5" />
        </FrameButton>

        <span className="mx-1 h-4 w-px bg-neutral-200" />

        <div className="flex items-center gap-0.5">
          {MEDIA_WIDTH_PRESETS.map(preset => (
            <button
              key={preset}
              type="button"
              title={`عرض ${preset}٪`}
              onClick={() => update({ width: preset === 100 ? null : preset })}
              className={cn(
                'rounded px-1.5 py-1 text-[11px] transition-colors',
                (width ?? 100) === preset
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-500 hover:bg-neutral-100',
              )}
            >
              {preset}٪
            </button>
          ))}
        </div>

        <span className="mx-1 h-4 w-px bg-neutral-200" />

        <div className="flex items-center gap-0.5">
          <AlignButton
            title="چپ‌چین"
            active={align === 'start'}
            onClick={() => update({ align: 'start' })}
          >
            <AlignLeft className="size-3.5" />
          </AlignButton>
          <AlignButton
            title="وسط‌چین"
            active={align === 'center'}
            onClick={() => update({ align: 'center' })}
          >
            <AlignCenter className="size-3.5" />
          </AlignButton>
          <AlignButton
            title="راست‌چین"
            active={align === 'end'}
            onClick={() => update({ align: 'end' })}
          >
            <AlignRight className="size-3.5" />
          </AlignButton>
          <AlignButton
            title="تمام عرض"
            active={align === 'center' && !width}
            onClick={() => update({ width: null, align: 'center' })}
          >
            <AlignJustify className="size-3.5" />
          </AlignButton>
        </div>

        <span className="mx-1 h-4 w-px bg-neutral-200" />

        <label
          title="جایگزینی فایل"
          className="flex size-7 cursor-pointer items-center justify-center rounded text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
        >
          {replacing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Replace className="size-3.5" />
          )}
          <input
            type="file"
            accept={kind === 'image' ? 'image/*' : 'video/*'}
            className="hidden"
            onChange={event => {
              void replaceFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>

        <FrameButton
          title="تنظیمات (توضیح، لینک و…)"
          onClick={() => setSettingsOpen(open => !open)}
          className={settingsOpen ? 'bg-neutral-100 text-neutral-900' : undefined}
        >
          <Settings2 className="size-3.5" />
        </FrameButton>

        <FrameButton title="حذف" tone="danger" onClick={() => deleteNode()}>
          <Trash2 className="size-3.5" />
        </FrameButton>
      </div>

      <div
        ref={stageRef}
        className="zp-figure__stage"
        onClick={() => selectNode(editor, getPos)}
      >
        {children}

        <span
          onPointerDown={startResize}
          title="تغییر اندازه"
          className="zp-figure__resizer"
          data-visible={selected || undefined}
        />
      </div>

      {settingsOpen && (
        <div className="zp-figure__settings" contentEditable={false}>
          <label className="block space-y-1">
            <span className="text-[11px] text-neutral-500">
              توضیح زیر فایل
            </span>
            <Input
              value={attrs.caption ?? ''}
              onChange={event => update({ caption: event.target.value })}
              placeholder="توضیح کوتاه (اختیاری)"
              className="h-8 bg-white text-xs"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] text-neutral-500">لینک</span>
            <Input
              value={attrs.href ?? ''}
              onChange={event => update({ href: event.target.value })}
              placeholder="https://… یا /product/…"
              className="h-8 bg-white text-xs"
              dir="ltr"
            />
          </label>

          {extraSettings}
        </div>
      )}

      {(attrs.caption || selected) && (
        <figcaption className="zp-figure__caption" contentEditable={false}>
          <input
            value={attrs.caption ?? ''}
            onChange={event => update({ caption: event.target.value })}
            placeholder="توضیح تصویر…"
            className="w-full border-none bg-transparent text-center text-xs text-neutral-500 outline-none placeholder:text-neutral-300"
          />
        </figcaption>
      )}
    </NodeViewWrapper>
  );
}

/** دکمه‌ی کوچک نوار ابزار رسانه */
export function AlignButton({
  children,
  title,
  active,
  onClick,
}: {
  children: ReactNode;
  title: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        'flex size-7 items-center justify-center rounded transition-colors',
        active
          ? 'bg-neutral-900 text-white'
          : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800',
      )}
    >
      {children}
    </button>
  );
}

/** دکمه‌ی ابزار با امکان کلاس اضافه (برای وضعیت فعال) */
function FrameButton({
  children,
  title,
  onClick,
  disabled,
  tone = 'default',
  className,
}: {
  children: ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex size-7 items-center justify-center rounded transition-colors disabled:cursor-not-allowed disabled:opacity-35',
        tone === 'danger'
          ? 'text-red-600 hover:bg-red-50'
          : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800',
        className,
      )}
    >
      {children}
    </button>
  );
}
