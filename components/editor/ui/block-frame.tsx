'use client';

import { useReactNodeView } from '@tiptap/react';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  Trash2,
} from 'lucide-react';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { BLOCK_LABELS,EditorBlockKind } from '../lib/types';

/**
 * قاب مشترک بلوک‌های ویژه‌ی ادیتور.
 *
 * شامل دستگیره‌ی درگ (مثل گوتنبرگ وردپرس)، برچسب نوع بلوک، عنوان و
 * دکمه‌های جابه‌جایی/کپی/حذف است تا همه‌ی بلوک‌ها حس یکسانی بدهند.
 */
export default function BlockFrame({
  kind,
  label = BLOCK_LABELS[kind],
  icon,
  selected = false,
  children,
  header,
  footer,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
  canMoveUp = true,
  canMoveDown = true,
  className,
}: {
  kind: EditorBlockKind;
  label?: string;
  icon?: ReactNode;
  selected?: boolean;
  children: ReactNode;
  /** کنترل‌های اختصاصی بلوک در نوار بالا (کلیدها، ورودی عنوان و…) */
  header?: ReactNode;
  footer?: ReactNode;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  className?: string;
}) {
  const { onDragStart } = useReactNodeView();

  return (
    <div
      className={cn(
        'zp-frame my-3 rounded-lg border bg-white transition-colors',
        selected
          ? 'border-neutral-900 ring-1 ring-neutral-900/10'
          : 'border-neutral-200 hover:border-neutral-300',
        className,
      )}
      data-selected={selected || undefined}
    >
      <div className="flex items-center gap-1.5 border-b border-neutral-100 px-2 py-1.5">
        <span
          data-drag-handle
          draggable
          onDragStart={event => {
            event.stopPropagation();
            onDragStart?.(event.nativeEvent);
          }}
          title="گرفتن و جابه‌جا کردن بلوک"
          className="flex cursor-grab touch-none items-center rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </span>

        <span className="flex items-center gap-1.5 bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-600">
          {icon}
          {label}
        </span>

        <div className="flex min-w-0 flex-1 items-center gap-2">{header}</div>

        <div className="flex items-center gap-0.5">
          {onMoveUp && (
            <FrameButton
              title="انتقال به بالا"
              disabled={!canMoveUp}
              onClick={onMoveUp}
            >
              <ArrowUp className="size-3.5" />
            </FrameButton>
          )}

          {onMoveDown && (
            <FrameButton
              title="انتقال به پایین"
              disabled={!canMoveDown}
              onClick={onMoveDown}
            >
              <ArrowDown className="size-3.5" />
            </FrameButton>
          )}

          {onDuplicate && (
            <FrameButton title="کپی بلوک" onClick={onDuplicate}>
              <Copy className="size-3.5" />
            </FrameButton>
          )}

          {onRemove && (
            <FrameButton title="حذف بلوک" tone="danger" onClick={onRemove}>
              <Trash2 className="size-3.5" />
            </FrameButton>
          )}
        </div>
      </div>

      <div className="p-3">{children}</div>

      {footer && (
        <div className="border-t border-neutral-100 px-3 py-2">{footer}</div>
      )}
    </div>
  );
}

/** دکمه‌ی کوچک نوار ابزار بلوک */
export function FrameButton({
  children,
  title,
  onClick,
  disabled,
  tone = 'default',
  className,
}: {
  children: ReactNode;
  title: string;
  onClick?: () => void;
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

/** ورودی عنوان بلوک (بدون حاشیه و هم‌اندازه‌ی متن نوار بالا) */
export function BlockTitleInput({
  value,
  onChange,
  placeholder = 'عنوان بخش (اختیاری)',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      className={cn(
        'h-8 w-full max-w-72 rounded border border-transparent bg-transparent px-2 text-xs text-neutral-700 outline-none transition-colors placeholder:text-neutral-400 hover:border-neutral-200 focus:border-neutral-300 focus:bg-white',
        className,
      )}
    />
  );
}
