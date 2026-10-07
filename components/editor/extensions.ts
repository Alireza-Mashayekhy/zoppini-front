import type { Extensions } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import {
  BackgroundColor,
  Color,
  FontSize,
  TextStyle,
} from '@tiptap/extension-text-style';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';

import { Direction } from './extensions/direction';
import { SlashCommand } from './extensions/slash-command';
import { blogBlockNodes } from './nodes/blog-blocks';
import { EditorImage } from './nodes/image-node';
import { EditorVideo } from './nodes/video-node';

/**
 * بسته‌ی افزونه‌های ادیتور.
 *
 * همه‌ی این افزونه‌ها MIT و رایگان‌اند (هسته‌ی Tiptap v3) و سطح امکانات
 * ادیتور وردپرس را پوشش می‌دهند: تیترها، قالب‌بندی متن، رنگ و اندازه
 * فونت، چینش و جهت، لیست‌ها، نقل‌قول، کد، جدول، لینک، تصویر، ویدیو،
 * جداکننده و شمارش کلمات — به‌علاوه‌ی بلوک‌های اختصاصی خود سایت
 * (اسلایدر محصولات، گالری، سوالات متداول و فهرست مطالب).
 */

const lowlight = createLowlight(common);

export interface EditorExtensionOptions {
  /** متن راهنمای داخل ادیتور خالی */
  placeholder?: string;
  /** بلوک‌های ویژه‌ی مقاله فعال باشند؟ (برای توضیحات محصول خاموش است) */
  blogBlocks?: boolean;
  /** وضعیت منوی اسلش (باز/بسته و مدیریت کلیدها) */
  slash?: {
    isOpen: () => boolean;
    onKeyDown: (event: KeyboardEvent) => boolean;
  };
}

/** ساخت فهرست افزونه‌ها بر اساس گزینه‌ها */
export function createEditorExtensions(
  options: EditorExtensionOptions = {},
): Extensions {
  const { placeholder, blogBlocks = false, slash } = options;

  const extensions: Extensions = [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      // بلوک کد با رنگ‌بندی زبان (lowlight) جایگزین نسخه‌ی ساده می‌شود
      codeBlock: false,
      // لینک جداگانه با تنظیمات امنیتی خودمان اضافه می‌شود
      link: false,
      dropcursor: { color: '#404040', width: 2 },
      horizontalRule: { HTMLAttributes: { class: 'zp-hr' } },
      blockquote: { HTMLAttributes: { class: 'zp-quote' } },
    }),

    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      HTMLAttributes: { rel: 'noopener noreferrer' },
    }),

    TextAlign.configure({
      types: ['heading', 'paragraph'],
      // مقدارهای منطقی تا در متن راست‌به‌چپ درست کار کنند
      alignments: ['start', 'center', 'end', 'justify'],
      defaultAlignment: null,
    }),

    Direction,
    TextStyle,
    Color,
    BackgroundColor,
    FontSize,

    Highlight.configure({ multicolor: true }),
    Subscript,
    Superscript,

    TaskList,
    TaskItem.configure({ nested: true }),

    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: { class: 'zp-code-block', dir: 'ltr', spellcheck: 'false' },
    }),

    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,

    CharacterCount,

    Placeholder.configure({
      includeChildren: true,
      placeholder: ({ node }) => {
        if (node.type.name === 'heading') {
          return `تیتر سطح ${node.attrs.level}`;
        }

        if (node.type.name === 'codeBlock') {
          return 'کد را اینجا بنویسید…';
        }

        return (
          placeholder ??
          'متن را بنویسید… برای درج عکس، جدول، اسلایدر یا سوالات متداول «/» بزنید'
        );
      },
    }),

    EditorImage,
    EditorVideo,

    SlashCommand.configure({
      isOpen: slash?.isOpen ?? (() => false),
      onKeyDown: slash?.onKeyDown ?? (() => false),
    }),
  ];

  if (blogBlocks) {
    extensions.push(...blogBlockNodes);
  }

  return extensions;
}

/** اندازه‌های فونت آماده (پیکسل) */
export const FONT_SIZES = [
  { label: 'خیلی کوچک', value: '12px' },
  { label: 'کوچک', value: '14px' },
  { label: 'معمولی', value: '16px' },
  { label: 'متوسط', value: '18px' },
  { label: 'بزرگ', value: '22px' },
  { label: 'خیلی بزرگ', value: '28px' },
  { label: 'عنوان', value: '34px' },
] as const;

/** پالت رنگ متن (هماهنگ با پالت خنثی سایت + رنگ برند) */
export const TEXT_COLORS = [
  '#171717',
  '#404040',
  '#737373',
  '#a3a3a3',
  '#b8895a',
  '#d4a373',
  '#8c1d1d',
  '#1d6f42',
  '#1d4e89',
  '#6d28d9',
] as const;

/** پالت رنگ پس‌زمینه (هایلایت) */
export const HIGHLIGHT_COLORS = [
  '#fef08a',
  '#bbf7d0',
  '#bfdbfe',
  '#fecaca',
  '#e9d5ff',
  '#fed7aa',
  '#e5e7eb',
] as const;
