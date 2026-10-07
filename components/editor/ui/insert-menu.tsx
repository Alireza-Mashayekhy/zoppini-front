'use client';

import type { Editor } from '@tiptap/core';
import {
  Code,
  GalleryHorizontal,
  Heading2,
  ImageIcon,
  ListChecks,
  ListTree,
  MessageCircleQuestion,
  Minus,
  Plus,
  Quote,
  SlidersHorizontal,
  Table as TableIcon,
  Video,
} from 'lucide-react';
import { ReactNode } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { insertEditorBlock } from '../lib/insert';
import { EditorBlockKind } from '../lib/types';
import { MediaDialogMode } from './media-dialog';
import { ToolbarTextButton } from './toolbar-button';

/**
 * منوی «افزودن» — همه‌ی چیزهایی که می‌توان داخل متن درج کرد.
 *
 * همان کاری را می‌کند که منوی «/» انجام می‌دهد، ولی با کلیک؛ پس همیشه
 * در دسترس است حتی اگر کاربر میان‌بر اسلش را نداند.
 */
export default function InsertMenu({
  editor,
  blogBlocks = false,
  onInsertMedia,
  open,
  onOpenChange,
  trigger,
}: {
  editor: Editor;
  blogBlocks?: boolean;
  onInsertMedia: (mode: MediaDialogMode) => void;
  /** حالت کنترل‌شده (برای منوی شناور «+» کنار بند خالی) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
}) {
  return (
    <DropdownMenu
      {...(open === undefined ? {} : { open, onOpenChange })}
    >
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <span className="inline-flex">
            <ToolbarTextButton title="افزودن بلوک">
              <Plus className="size-4" />
              افزودن
            </ToolbarTextButton>
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-[11px] text-neutral-400">
          رسانه
        </DropdownMenuLabel>

        <DropdownMenuItem onClick={() => onInsertMedia('image')}>
          <ImageIcon className="size-4" />
          تصویر
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => onInsertMedia('video')}>
          <Video className="size-4" />
          ویدیو
        </DropdownMenuItem>

        {blogBlocks && (
          <DropdownMenuItem onClick={() => onInsertMedia('gallery')}>
            <GalleryHorizontal className="size-4" />
            گالری عکس و فیلم
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-[11px] text-neutral-400">
          ساختار متن
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({ level: 2 })
              .run()
          }
        >
          <Heading2 className="size-4" />
          تیتر ۲
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="size-4" />
          نقل‌قول
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => editor.chain().focus().toggleTaskList().run()}>
          <ListChecks className="size-4" />
          لیست انجام کار
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="size-4" />
          بلوک کد
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <TableIcon className="size-4" />
          جدول
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="size-4" />
          خط جداکننده
        </DropdownMenuItem>

        {blogBlocks && (
          <>
            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-[11px] text-neutral-400">
              بلوک‌های مقاله
            </DropdownMenuLabel>

            <DropdownMenuItem
              onClick={() => insertEditorBlock(editor, 'slider' as EditorBlockKind)}
            >
              <SlidersHorizontal className="size-4" />
              اسلایدر محصولات
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => insertEditorBlock(editor, 'faq' as EditorBlockKind)}
            >
              <MessageCircleQuestion className="size-4" />
              سوالات متداول
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => insertEditorBlock(editor, 'toc' as EditorBlockKind)}
            >
              <ListTree className="size-4" />
              فهرست مطالب
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
