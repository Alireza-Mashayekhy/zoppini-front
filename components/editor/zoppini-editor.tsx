'use client';

import './editor.css';

import type { Editor } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import { FloatingMenu } from '@tiptap/react/menus';
import { Loader2, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { createEditorExtensions } from './extensions';
import { insertGalleryBlock, insertMediaEntries } from './lib/insert';
import { cleanPastedHtml } from './lib/paste';
import { getSlashQuery } from './lib/slash';
import BubbleToolbar from './ui/bubble-toolbar';
import InsertMenu from './ui/insert-menu';
import MediaDialog, { MediaDialogMode, MediaEntry } from './ui/media-dialog';
import SlashMenu, {
  buildSlashItems,
  filterSlashItems,
  SlashItem,
} from './ui/slash-menu';
import EditorToolbar from './ui/toolbar';
import { ToolbarButton } from './ui/toolbar-button';

/**
 * ویرایشگر متن یکپارچه‌ی زوپینی (بر پایه‌ی Tiptap v3 — کاملاً رایگان/MIT).
 *
 * چه چیزی دارد؟
 *  - همه‌ی امکانات پایه‌ی ادیتور وردپرس: تیترها، قالب‌بندی متن، رنگ و
 *    اندازه فونت، چینش و جهت، لیست‌ها، نقل‌قول، کد، جدول، لینک، تصویر،
 *    ویدیو، جداکننده، شمارش کلمه و نمای کد HTML.
 *  - بلوک‌های اختصاصی سایت داخل خود متن: اسلایدر محصولات، گالری عکس و
 *    فیلم، سوالات متداول و فهرست مطالب (با درگ‌دراپ و ویرایش درجا).
 *  - منوی «/» و دکمه‌ی شناور «+» برای درج سریع بلوک‌ها.
 *
 * خروجی همیشه یک رشته HTML است؛ همان چیزی که در ستون content ذخیره
 * می‌شود و بک‌اند از آن بلوک‌های نمایشی را می‌سازد.
 */

export interface ZoppiniEditorProps {
  /** محتوای HTML فعلی */
  value?: string;
  /** با هر تغییر متن فراخوانی می‌شود */
  onChange?: (html: string) => void;
  /** «blog» بلوک‌های مقاله را فعال می‌کند؛ «simple» فقط متن غنی است */
  variant?: 'blog' | 'simple';
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  /** حداکثر ارتفاع ناحیه‌ی نوشتن (عدد = پیکسل، رشته = هر مقدار CSS) */
  maxHeight?: number | string;
  className?: string;
  autoFocus?: boolean;
  /** نمایش نوار ابزار (برای حالت‌های فشرده می‌توان خاموش کرد) */
  toolbar?: boolean;
  id?: string;
}

interface SlashState {
  query: string;
  from: number;
  to: number;
  top: number;
  left: number;
}

/** پهنای تقریبی منوی اسلش برای نگه‌داشتنش داخل کادر ادیتور */
const SLASH_MENU_WIDTH = 264;

/** وضعیت لحظه‌ای منوی اسلش که افزونه‌ی تایپ‌تپ از آن می‌خواند */
interface SlashApi {
  open: boolean;
  onKeyDown: (event: KeyboardEvent) => boolean;
}

/**
 * پل بین منوی اسلش (وضعیت ری‌اکت) و افزونه‌ی کلیدها (یک‌بار ساخته می‌شود).
 *
 * این تابع بیرون کامپوننت تعریف شده تا خود افزونه همیشه توابع پایدار
 * بگیرد و مقدار واقعی هر بار از ref خوانده شود.
 */
function createSlashBridge(api: { current: SlashApi }) {
  return {
    isOpen: () => api.current.open,
    onKeyDown: (event: KeyboardEvent) => api.current.onKeyDown(event),
  };
}

export default function ZoppiniEditor({
  value = '',
  onChange,
  variant = 'simple',
  placeholder,
  disabled = false,
  minHeight = 260,
  maxHeight,
  className,
  autoFocus = false,
  toolbar = true,
  id,
}: ZoppiniEditorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const lastHtml = useRef(value);

  const [fullscreen, setFullscreen] = useState(false);
  const [mediaMode, setMediaMode] = useState<MediaDialogMode | null>(null);
  const [floatingOpen, setFloatingOpen] = useState(false);
  const [slash, setSlash] = useState<SlashState | null>(null);
  /**
   * گزینه‌ی فعال منوی اسلش به‌همراه عبارت جست‌وجویی که برایش انتخاب شده.
   * با عوض شدن عبارت، انتخاب به‌طور خودکار به گزینه‌ی اول برمی‌گردد (بدون
   * نیاز به effect) و اگر لیست کوتاه‌تر شد، اندیس در محدوده می‌ماند.
   */
  const [slashSelection, setSlashSelection] = useState({ query: '', index: 0 });

  /**
   * رابط منوی اسلش برای افزونه‌ی کلیدها.
   *
   * افزونه‌ها یک‌بار ساخته می‌شوند، پس وضعیت لحظه‌ای منو از طریق ref
   * خوانده می‌شود تا همیشه تازه باشد.
   */
  const slashApi = useRef<SlashApi>({ open: false, onKeyDown: () => false });

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const blogBlocks = variant === 'blog';

  /** به‌روزرسانی وضعیت و جای منوی اسلش بعد از هر تراکنش */
  const syncSlash = (instance: Editor) => {
    const query = getSlashQuery(instance);

    if (!query) {
      slashApi.current.open = false;
      setSlash(current => (current ? null : current));
      return;
    }

    const box = scrollRef.current?.getBoundingClientRect();
    const coords = instance.view.coordsAtPos(query.from);

    const maxLeft = Math.max(8, (box?.width ?? SLASH_MENU_WIDTH) - SLASH_MENU_WIDTH - 8);
    const left = Math.min(Math.max(8, coords.left - (box?.left ?? 0)), maxLeft);

    slashApi.current.open = true;

    setSlash({
      ...query,
      top: coords.bottom - (box?.top ?? 0) + 8,
      left,
    });
  };

  const editor = useEditor(
    {
      // در Next.js لازم است تا رندر سمت سرور خطای hydration ندهد
      immediatelyRender: false,
      editable: !disabled,
      autofocus: autoFocus ? 'end' : false,
      extensions: createEditorExtensions({
        blogBlocks,
        placeholder,
        /**
         * افزونه‌ها فقط یک‌بار (ساخت ادیتور) ساخته می‌شوند، پس منوی اسلش
         * وضعیت لحظه‌ای خودش را از طریق این ref در اختیارشان می‌گذارد؛
         * خود ref در بدنه‌ی رندر خوانده یا نوشته نمی‌شود.
         */
        // eslint-disable-next-line react-hooks/refs
        slash: createSlashBridge(slashApi),
      }),
      content: value,
      editorProps: {
        attributes: {
          class: 'zp-content zp-prose',
          dir: 'rtl',
          spellcheck: 'false',
        },
        transformPastedHTML: html => cleanPastedHtml(html),
      },
      onUpdate: ({ editor: instance }) => {
        const html = instance.getHTML();
        lastHtml.current = html;
        onChangeRef.current?.(html);
      },
      onTransaction: ({ editor: instance }) => syncSlash(instance),
    },
    [variant, blogBlocks],
  );

  /** همگام‌سازی با مقدار بیرونی (ریست فرم یا رسیدن داده‌ی سرور) */
  useEffect(() => {
    if (!editor) return;

    const next = value ?? '';

    if (next === lastHtml.current) return;

    lastHtml.current = next;

    if (next === editor.getHTML()) return;

    editor.commands.setContent(next, { emitUpdate: false });
  }, [value, editor]);

  /** حالت فقط‌خوانندگی */
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  /** خروج از تمام‌صفحه با Escape */
  useEffect(() => {
    if (!fullscreen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false);
    };

    window.addEventListener('keydown', handleKey);

    return () => window.removeEventListener('keydown', handleKey);
  }, [fullscreen]);

  const slashItems = useMemo(
    () =>
      editor
        ? buildSlashItems({
            editor,
            blogBlocks,
            onInsertMedia: mode => setMediaMode(mode),
          })
        : [],
    [editor, blogBlocks],
  );

  const filteredItems = useMemo(
    () => filterSlashItems(slashItems, slash?.query ?? ''),
    [slashItems, slash?.query],
  );

  const slashQuery = slash?.query ?? '';

  const activeIndex =
    slashSelection.query === slashQuery
      ? Math.min(slashSelection.index, Math.max(filteredItems.length - 1, 0))
      : 0;

  /** انتخاب گزینه با ماوس یا کیبورد */
  const selectSlashIndex = (index: number) => {
    setSlashSelection({ query: slashQuery, index });
  };

  /** انتخاب یک گزینه از منوی اسلش */
  const pickSlashItem = (item: SlashItem) => {
    if (!editor) return;

    if (slash) {
      editor.chain().focus().deleteRange({ from: slash.from, to: slash.to }).run();
    }

    slashApi.current.open = false;
    setSlash(null);
    item.run();
  };

  /** مدیریت کلیدها وقتی منوی اسلش باز است */
  const handleSlashKeyDown = (event: KeyboardEvent): boolean => {
    if (event.key === 'Escape') {
      slashApi.current.open = false;
      setSlash(null);
      return true;
    }

    if (!slashApi.current.open) return false;

    const count = Math.max(filteredItems.length, 1);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectSlashIndex((activeIndex + 1) % count);
        return true;

      case 'ArrowUp':
        event.preventDefault();
        selectSlashIndex((activeIndex - 1 + count) % count);
        return true;

      case 'Enter':
      case 'Tab': {
        const item = filteredItems[activeIndex];

        if (!item) return false;

        event.preventDefault();
        pickSlashItem(item);
        return true;
      }

      default:
        return false;
    }
  };

  /**
   * همگام‌سازی ref افزونه بعد از هر رندر.
   *
   * ref عمداً داخل بدنه‌ی رندر نوشته نمی‌شود: افزونه در رویدادهای
   * پروسی‌میرور (خارج از رندر) از آن می‌خواند، پس آخرین مقدار commit‌شده
   * کافی و درست است.
   */
  useEffect(() => {
    slashApi.current.open = !!slash && filteredItems.length > 0;
    slashApi.current.onKeyDown = handleSlashKeyDown;
  });

  const handleMediaConfirm = (entries: MediaEntry[]) => {
    if (!editor) return;

    if (mediaMode === 'gallery') insertGalleryBlock(editor, entries);
    else insertMediaEntries(editor, entries);
  };

  if (!editor) {
    return (
      <div
        className={cn(
          'zp-editor flex items-center justify-center gap-2 text-sm text-neutral-400',
          className,
        )}
        style={{ minHeight }}
      >
        <Loader2 className="size-4 animate-spin" />
        در حال آماده‌سازی ادیتور…
      </div>
    );
  }

  return (
    <div
      id={id}
      className={cn('zp-editor', fullscreen && 'is-fullscreen', className)}
      dir="rtl"
    >
      {toolbar && (
        <EditorToolbar
          editor={editor}
          blogBlocks={blogBlocks}
          fullscreen={fullscreen}
          onToggleFullscreen={() => setFullscreen(current => !current)}
        />
      )}

      <div
        ref={scrollRef}
        className="zp-editor__scroll"
        style={{ minHeight, maxHeight }}
      >
        <EditorContent editor={editor} className="zp-editor__content" />

        {slash && filteredItems.length > 0 && (
          <div
            className="absolute z-30"
            style={{ top: slash.top, left: slash.left }}
          >
            <SlashMenu
              items={filteredItems}
              activeIndex={activeIndex}
              onPick={pickSlashItem}
              onHover={selectSlashIndex}
            />
          </div>
        )}

        <FloatingMenu
          editor={editor}
          updateDelay={100}
          shouldShow={({ editor: current, state }) => {
            const { $from, empty } = state.selection;

            if (!empty || !current.isEditable) return false;

            const parent = $from.parent;

            return (
              parent.isTextblock &&
              parent.content.size === 0 &&
              !current.isActive('codeBlock')
            );
          }}
        >
          <InsertMenu
            editor={editor}
            blogBlocks={blogBlocks}
            onInsertMedia={mode => setMediaMode(mode)}
            open={floatingOpen}
            onOpenChange={setFloatingOpen}
            trigger={
              <span className="zp-floating">
                <ToolbarButton title="افزودن بلوک">
                  <Plus className="size-4" />
                </ToolbarButton>
              </span>
            }
          />
        </FloatingMenu>

        <BubbleToolbar editor={editor} />
      </div>

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
    </div>
  );
}
