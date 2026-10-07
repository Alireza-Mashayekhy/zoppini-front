'use client';

import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  Braces,
  ChevronDown,
  Code,
  GalleryHorizontal,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Highlighter,
  ImageIcon,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Maximize2,
  Minimize2,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
  Undo2,
  Video,
} from 'lucide-react';
import { useState } from 'react';

/** سطح‌های مجاز تیتر */
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { FONT_SIZES, HIGHLIGHT_COLORS, TEXT_COLORS } from '../extensions';
import { insertGalleryBlock, insertMediaEntries } from '../lib/insert';
import ColorMenu from './color-menu';
import HtmlSourceDialog from './html-source-dialog';
import InsertMenu from './insert-menu';
import LinkPopover from './link-popover';
import MediaDialog, { MediaDialogMode, MediaEntry } from './media-dialog';
import TableMenu from './table-menu';
import {
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
} from './toolbar-button';

/**
 * نوار ابزار ادیتور.
 *
 * چیدمان گروه‌ها همان چیزی است که کاربر وردپرس انتظار دارد: نوع بند،
 * واگردانی، قالب‌بندی متن، رنگ و اندازه، چینش و جهت، لیست‌ها، نقل‌قول و
 * کد، لینک، رسانه و جدول — و در انتها ابزارهای تمام‌صفحه، کد HTML و
 * شمارش کلمه‌ها.
 */

/** عنوان فارسی نوع بند فعلی */
const BLOCK_TYPE_LABELS: Record<string, string> = {
  paragraph: 'پاراگراف',
  heading1: 'تیتر ۱',
  heading2: 'تیتر ۲',
  heading3: 'تیتر ۳',
  heading4: 'تیتر ۴',
  heading5: 'تیتر ۵',
  heading6: 'تیتر ۶',
  blockquote: 'نقل‌قول',
  codeBlock: 'بلوک کد',
  bulletList: 'لیست نقطه‌ای',
  orderedList: 'لیست شماره‌دار',
  taskList: 'لیست انجام کار',
};

export default function EditorToolbar({
  editor,
  blogBlocks = false,
  fullscreen = false,
  onToggleFullscreen,
  className,
}: {
  editor: Editor;
  blogBlocks?: boolean;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
  className?: string;
}) {
  const [mediaMode, setMediaMode] = useState<MediaDialogMode | null>(null);
  const [htmlOpen, setHtmlOpen] = useState(false);

  /** وضعیت لحظه‌ای ادیتور (برای فعال/غیرفعال بودن دکمه‌ها) */
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      if (!current) return null;

      const headingLevel = current.isActive('heading')
        ? Number(current.getAttributes('heading').level)
        : null;

      const blockType = headingLevel
        ? `heading${headingLevel}`
        : current.isActive('blockquote')
          ? 'blockquote'
          : current.isActive('codeBlock')
            ? 'codeBlock'
            : current.isActive('taskList')
              ? 'taskList'
              : current.isActive('orderedList')
                ? 'orderedList'
                : current.isActive('bulletList')
                  ? 'bulletList'
                  : 'paragraph';

      return {
        blockType,
        bold: current.isActive('bold'),
        italic: current.isActive('italic'),
        underline: current.isActive('underline'),
        strike: current.isActive('strike'),
        subscript: current.isActive('subscript'),
        superscript: current.isActive('superscript'),
        blockquote: current.isActive('blockquote'),
        codeBlock: current.isActive('codeBlock'),
        bulletList: current.isActive('bulletList'),
        orderedList: current.isActive('orderedList'),
        taskList: current.isActive('taskList'),
        alignStart: current.isActive({ textAlign: 'start' }),
        alignCenter: current.isActive({ textAlign: 'center' }),
        alignEnd: current.isActive({ textAlign: 'end' }),
        alignJustify: current.isActive({ textAlign: 'justify' }),
        direction:
          (current.getAttributes('heading').dir as string | null) ??
          (current.getAttributes('paragraph').dir as string | null),
        link: current.isActive('link'),
        color: (current.getAttributes('textStyle').color as string) ?? null,
        highlight: (current.getAttributes('highlight').color as string) ?? null,
        fontSize: (current.getAttributes('textStyle').fontSize as string) ?? null,
        canUndo: current.can().undo(),
        canRedo: current.can().redo(),
        canSink: current.can().sinkListItem('listItem'),
        canLift: current.can().liftListItem('listItem'),
        words: current.storage.characterCount?.words?.() ?? 0,
        characters: current.storage.characterCount?.characters?.() ?? 0,
      };
    },
  });

  const setBlockType = (type: string) => {
    const chain = editor.chain().focus();

    if (type.startsWith('heading')) {
      chain.toggleHeading({ level: Number(type.replace('heading', '')) as HeadingLevel }).run();
      return;
    }

    switch (type) {
      case 'paragraph':
        chain.setParagraph().run();
        break;
      case 'blockquote':
        chain.toggleBlockquote().run();
        break;
      case 'codeBlock':
        chain.toggleCodeBlock().run();
        break;
      case 'bulletList':
        chain.toggleBulletList().run();
        break;
      case 'orderedList':
        chain.toggleOrderedList().run();
        break;
      case 'taskList':
        chain.toggleTaskList().run();
        break;
      default:
        chain.setParagraph().run();
    }
  };

  const handleMediaConfirm = (entries: MediaEntry[]) => {
    if (mediaMode === 'gallery') insertGalleryBlock(editor, entries);
    else insertMediaEntries(editor, entries);
  };

  const active = state?.blockType ?? 'paragraph';

  return (
    <div
      className={cn(
        'zp-toolbar flex flex-wrap items-center gap-x-1 gap-y-1.5 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5',
        className,
      )}
      dir="rtl"
    >
      {/* ── نوع بند ─────────────────────────────────────────────── */}
      <ToolbarGroup>
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="نوع بند"
              className="flex h-8 min-w-28 items-center gap-1 rounded px-2 text-xs text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              {active.startsWith('heading') ? (
                <Heading2 className="size-3.5" />
              ) : active === 'blockquote' ? (
                <Quote className="size-3.5" />
              ) : active === 'codeBlock' ? (
                <Code className="size-3.5" />
              ) : (
                <Pilcrow className="size-3.5" />
              )}
              {BLOCK_TYPE_LABELS[active] ?? 'پاراگراف'}
              <ChevronDown className="size-3 text-neutral-400" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem onClick={() => setBlockType('paragraph')}>
              <Pilcrow className="size-4" />
              پاراگراف
            </DropdownMenuItem>

            {[1, 2, 3, 4].map(level => (
              <DropdownMenuItem
                key={level}
                onClick={() => setBlockType(`heading${level}`)}
              >
                {level === 1 ? (
                  <Heading1 className="size-4" />
                ) : level === 2 ? (
                  <Heading2 className="size-4" />
                ) : level === 3 ? (
                  <Heading3 className="size-4" />
                ) : (
                  <Heading4 className="size-4" />
                )}
                تیتر {level}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => setBlockType('blockquote')}>
              <Quote className="size-4" />
              نقل‌قول
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setBlockType('codeBlock')}>
              <Code className="size-4" />
              بلوک کد
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* اندازه فونت */}
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="اندازه متن"
              className="flex h-8 items-center gap-1 rounded px-2 text-xs text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              {state?.fontSize ?? 'اندازه'}
              <ChevronDown className="size-3 text-neutral-400" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem onClick={() => editor.chain().focus().unsetFontSize().run()}>
              پیش‌فرض
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {FONT_SIZES.map(size => (
              <DropdownMenuItem
                key={size.value}
                onClick={() => editor.chain().focus().setFontSize(size.value).run()}
                className={cn(state?.fontSize === size.value && 'bg-neutral-100')}
              >
                <span style={{ fontSize: Math.min(20, Number.parseInt(size.value, 10)) }}>
                  {size.label}
                </span>
                <span className="ms-auto text-[11px] text-neutral-400">
                  {size.value}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </ToolbarGroup>

      <ToolbarDivider />

      {/* ── واگردانی ────────────────────────────────────────────── */}
      <ToolbarGroup>
        <ToolbarButton
          title="واگردانی (Ctrl+Z)"
          disabled={!state?.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="بازگردانی (Ctrl+Y)"
          disabled={!state?.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="size-4" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarDivider />

      {/* ── قالب‌بندی متن ───────────────────────────────────────── */}
      <ToolbarGroup>
        <ToolbarButton
          title="درشت (Ctrl+B)"
          active={state?.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="کج (Ctrl+I)"
          active={state?.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="زیرخط (Ctrl+U)"
          active={state?.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="خط‌خورده (Ctrl+Shift+X)"
          active={state?.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="زیرنویس"
          active={state?.subscript}
          onClick={() => editor.chain().focus().toggleSubscript().run()}
        >
          <Subscript className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="بالانویس"
          active={state?.superscript}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
        >
          <Superscript className="size-4" />
        </ToolbarButton>

        <ColorMenu
          title="رنگ متن"
          icon={<Baseline className="size-4" />}
          colors={TEXT_COLORS}
          current={state?.color}
          onPick={color => editor.chain().focus().setColor(color).run()}
          onClear={() => editor.chain().focus().unsetColor().run()}
        />

        <ColorMenu
          title="هایلایت (پس‌زمینه متن)"
          icon={<Highlighter className="size-4" />}
          colors={HIGHLIGHT_COLORS}
          current={state?.highlight}
          onPick={color => editor.chain().focus().toggleHighlight({ color }).run()}
          onClear={() => editor.chain().focus().unsetHighlight().run()}
        />

        <ToolbarButton
          title="حذف قالب‌بندی"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <RemoveFormatting className="size-4" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarDivider />

      {/* ── چینش و جهت ──────────────────────────────────────────── */}
      <ToolbarGroup>
        <ToolbarButton
          title="چپ‌چین"
          active={state?.alignStart}
          onClick={() => editor.chain().focus().setTextAlign('start').run()}
        >
          <AlignLeft className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="وسط‌چین"
          active={state?.alignCenter}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="راست‌چین"
          active={state?.alignEnd}
          onClick={() => editor.chain().focus().setTextAlign('end').run()}
        >
          <AlignRight className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="هم‌تراز (justify)"
          active={state?.alignJustify}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          <AlignJustify className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          title={`جهت متن: ${state?.direction === 'ltr' ? 'چپ‌به‌راست' : 'راست‌به‌چپ'} (کلیک برای تغییر)`}
          active={state?.direction === 'ltr'}
          onClick={() => editor.chain().focus().toggleDirection().run()}
        >
          <span className="text-[11px] font-medium">
            {state?.direction === 'ltr' ? 'LTR' : 'RTL'}
          </span>
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarDivider />

      {/* ── لیست‌ها ─────────────────────────────────────────────── */}
      <ToolbarGroup>
        <ToolbarButton
          title="لیست نقطه‌ای (Ctrl+Shift+8)"
          active={state?.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="لیست شماره‌دار (Ctrl+Shift+7)"
          active={state?.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="لیست انجام کار"
          active={state?.taskList}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListChecks className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="تورفتگی بیشتر"
          disabled={!state?.canSink}
          onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
        >
          <IndentIncrease className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="کاهش تورفتگی"
          disabled={!state?.canLift}
          onClick={() => editor.chain().focus().liftListItem('listItem').run()}
        >
          <IndentDecrease className="size-4" />
        </ToolbarButton>
      </ToolbarGroup>

      <ToolbarDivider />

      {/* ── بلوک‌های متنی ───────────────────────────────────────── */}
      <ToolbarGroup>
        <ToolbarButton
          title="نقل‌قول"
          active={state?.blockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="بلوک کد"
          active={state?.codeBlock}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          title="خط جداکننده"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="size-4" />
        </ToolbarButton>
        <LinkPopover editor={editor} />
      </ToolbarGroup>

      <ToolbarDivider />

      {/* ── رسانه و جدول ────────────────────────────────────────── */}
      <ToolbarGroup>
        <ToolbarButton
          title="درج تصویر"
          onClick={() => setMediaMode('image')}
        >
          <ImageIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton title="درج ویدیو" onClick={() => setMediaMode('video')}>
          <Video className="size-4" />
        </ToolbarButton>
        {blogBlocks && (
          <ToolbarButton
            title="درج گالری عکس و فیلم"
            onClick={() => setMediaMode('gallery')}
          >
            <GalleryHorizontal className="size-4" />
          </ToolbarButton>
        )}
        <TableMenu editor={editor} />
        <InsertMenu
          editor={editor}
          blogBlocks={blogBlocks}
          onInsertMedia={mode => setMediaMode(mode)}
        />
      </ToolbarGroup>

      <ToolbarDivider />

      {/* ── ابزارها ─────────────────────────────────────────────── */}
      <ToolbarGroup className="ms-auto">
        <span className="hidden whitespace-nowrap px-1 text-[11px] text-neutral-400 lg:inline">
          {state?.words ?? 0} کلمه / {state?.characters ?? 0} نویسه
        </span>

        <ToolbarButton title="کد HTML" onClick={() => setHtmlOpen(true)}>
          <Braces className="size-4" />
        </ToolbarButton>

        {onToggleFullscreen && (
          <ToolbarButton
            title={fullscreen ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه'}
            onClick={onToggleFullscreen}
          >
            {fullscreen ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </ToolbarButton>
        )}
      </ToolbarGroup>

      {mediaMode && (
        <MediaDialog
          open={!!mediaMode}
          mode={mediaMode}
          onOpenChange={open => {
            if (!open) setMediaMode(null);
          }}
          onConfirm={handleMediaConfirm}
        />
      )}

      <HtmlSourceDialog open={htmlOpen} onOpenChange={setHtmlOpen} editor={editor} />
    </div>
  );
}
