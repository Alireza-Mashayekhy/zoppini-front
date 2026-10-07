'use client';

import type { Editor } from '@tiptap/core';
import {
  Code,
  GalleryHorizontal,
  Heading2,
  Heading3,
  ImageIcon,
  List,
  ListChecks,
  ListOrdered,
  ListTree,
  MessageCircleQuestion,
  Minus,
  Quote,
  SlidersHorizontal,
  Table as TableIcon,
  Video,
} from 'lucide-react';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { insertEditorBlock } from '../lib/insert';
import { MediaDialogMode } from './media-dialog';

/**
 * منوی اسلش («/») — مثل گوتنبرگ وردپرس.
 *
 * کاربر وسط تایپ «/» می‌زند و فهرست کارهای ممکن ظاهر می‌شود؛ با کلیدهای
 * جهت‌نما انتخاب و با Enter درج می‌شود. جستجو هم فارسی است هم انگلیسی.
 */

export interface SlashItem {
  id: string;
  label: string;
  hint: string;
  /** کلیدواژه‌های جستجو (فارسی و لاتین، با فاصله جدا می‌شوند) */
  keywords: string;
  group: string;
  icon: ReactNode;
  run: () => void;
}

export function buildSlashItems({
  editor,
  blogBlocks = false,
  onInsertMedia,
}: {
  editor: Editor;
  blogBlocks?: boolean;
  onInsertMedia: (mode: MediaDialogMode) => void;
}): SlashItem[] {
  const items: SlashItem[] = [
    {
      id: 'heading2',
      label: 'تیتر ۲',
      hint: 'عنوان بخش',
      keywords: 'h2 heading title تیتر عنوان سر تیتر',
      group: 'متن',
      icon: <Heading2 className="size-4" />,
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      id: 'heading3',
      label: 'تیتر ۳',
      hint: 'زیرعنوان',
      keywords: 'h3 heading تیتر عنوان',
      group: 'متن',
      icon: <Heading3 className="size-4" />,
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      id: 'bulletList',
      label: 'لیست نقطه‌ای',
      hint: 'فهرست بدون شماره',
      keywords: 'ul list bullet لیست نقطه',
      group: 'متن',
      icon: <List className="size-4" />,
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      id: 'orderedList',
      label: 'لیست شماره‌دار',
      hint: 'فهرست شماره‌دار',
      keywords: 'ol list number لیست شماره',
      group: 'متن',
      icon: <ListOrdered className="size-4" />,
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      id: 'taskList',
      label: 'لیست انجام کار',
      hint: 'چک‌لیست',
      keywords: 'task todo check لیست کار چک',
      group: 'متن',
      icon: <ListChecks className="size-4" />,
      run: () => editor.chain().focus().toggleTaskList().run(),
    },
    {
      id: 'blockquote',
      label: 'نقل‌قول',
      hint: 'برجسته‌سازی گفتاورد',
      keywords: 'quote blockquote نقل قول',
      group: 'متن',
      icon: <Quote className="size-4" />,
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      id: 'codeBlock',
      label: 'بلوک کد',
      hint: 'کد با رنگ‌بندی زبان',
      keywords: 'code pre کد برنامه',
      group: 'متن',
      icon: <Code className="size-4" />,
      run: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      id: 'horizontalRule',
      label: 'خط جداکننده',
      hint: 'جدا کردن بخش‌ها',
      keywords: 'hr divider جدا کننده خط',
      group: 'متن',
      icon: <Minus className="size-4" />,
      run: () => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      id: 'table',
      label: 'جدول',
      hint: 'جدول ۳×۳ با سطر عنوان',
      keywords: 'table جدول',
      group: 'رسانه',
      icon: <TableIcon className="size-4" />,
      run: () =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    {
      id: 'image',
      label: 'تصویر',
      hint: 'آپلود عکس یا آدرس اینترنتی',
      keywords: 'image img photo عکس تصویر',
      group: 'رسانه',
      icon: <ImageIcon className="size-4" />,
      run: () => onInsertMedia('image'),
    },
    {
      id: 'video',
      label: 'ویدیو',
      hint: 'آپلود فیلم با پوستر',
      keywords: 'video movie فیلم ویدیو',
      group: 'رسانه',
      icon: <Video className="size-4" />,
      run: () => onInsertMedia('video'),
    },
  ];

  if (blogBlocks) {
    items.push(
      {
        id: 'gallery',
        label: 'گالری عکس و فیلم',
        hint: 'چند فایل پشت سر هم با توضیح',
        keywords: 'gallery media گالری رسانه عکس فیلم',
        group: 'بلوک مقاله',
        icon: <GalleryHorizontal className="size-4" />,
        run: () => onInsertMedia('gallery'),
      },
      {
        id: 'slider',
        label: 'اسلایدر محصولات',
        hint: 'محصولات فروشگاه میان متن',
        keywords: 'slider product اسلایدر محصول',
        group: 'بلوک مقاله',
        icon: <SlidersHorizontal className="size-4" />,
        run: () => insertEditorBlock(editor, 'slider'),
      },
      {
        id: 'faq',
        label: 'سوالات متداول',
        hint: 'سوال و پاسخ آکاردئونی',
        keywords: 'faq question سوال پاسخ متداول',
        group: 'بلوک مقاله',
        icon: <MessageCircleQuestion className="size-4" />,
        run: () => insertEditorBlock(editor, 'faq'),
      },
      {
        id: 'toc',
        label: 'فهرست مطالب',
        hint: 'از تیترهای مقاله ساخته می‌شود',
        keywords: 'toc contents فهرست مطالب',
        group: 'بلوک مقاله',
        icon: <ListTree className="size-4" />,
        run: () => insertEditorBlock(editor, 'toc'),
      },
    );
  }

  return items;
}

/** فیلتر گزینه‌ها بر اساس عبارت تایپ‌شده بعد از «/» */
export function filterSlashItems(items: SlashItem[], query: string): SlashItem[] {
  const term = query.trim().toLowerCase();

  if (!term) return items;

  return items.filter(item =>
    `${item.label} ${item.keywords} ${item.id}`.toLowerCase().includes(term),
  );
}

export default function SlashMenu({
  items,
  activeIndex,
  onPick,
  onHover,
}: {
  items: SlashItem[];
  activeIndex: number;
  onPick: (item: SlashItem) => void;
  onHover: (index: number) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="zp-slash-menu">
        <p className="px-3 py-2 text-xs text-neutral-500">موردی پیدا نشد</p>
      </div>
    );
  }

  return (
    <div className="zp-slash-menu">
      {items.map((item, index) => {
        // عنوان گروه فقط روی اولین آیتم هر گروه نشان داده می‌شود
        const showGroup = index === 0 || items[index - 1].group !== item.group;

        return (
          <div key={item.id}>
            {showGroup && (
              <p className="px-3 pb-1 pt-2 text-[10px] text-neutral-400">
                {item.group}
              </p>
            )}

            <button
              type="button"
              onClick={() => onPick(item)}
              onMouseEnter={() => onHover(index)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-start transition-colors',
                index === activeIndex ? 'bg-neutral-100' : 'hover:bg-neutral-50',
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded bg-white text-neutral-600 ring-1 ring-neutral-200">
                {item.icon}
              </span>

              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-neutral-800">
                  {item.label}
                </span>
                <span className="block truncate text-[10px] text-neutral-400">
                  {item.hint}
                </span>
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
