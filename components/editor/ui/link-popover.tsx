'use client';

import type { Editor } from '@tiptap/core';
import { ExternalLink, Link2, Unlink } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';

import { ToolbarButton } from './toolbar-button';

/**
 * مدیریت لینک‌ها (مثل وردپرس).
 *
 * آدرس، متن لینک و باز شدن در تب جدید از همین‌جا تنظیم می‌شود؛ اگر
 * متنی انتخاب نشده باشد، می‌توان متن لینک را هم نوشت.
 */

/** آدرس‌های بدون پروتکل به https تبدیل می‌شوند؛ مسیرهای داخلی دست‌نخورده */
export function normalizeUrl(value: string): string {
  const url = value.trim();

  if (!url) return '';
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(url)) return url;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(url)) return `https://${url}`;

  return url;
}

export default function LinkPopover({
  editor,
  trigger,
}: {
  editor: Editor;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState('');
  const [text, setText] = useState('');
  const [newTab, setNewTab] = useState(true);

  const isLink = editor.isActive('link');

  /**
   * خواندن لینک و متن انتخاب‌شده.
   *
   * فقط موقع باز شدن پنل (رویداد کاربر) صدا زده می‌شود تا مقدارها همیشه
   * با انتخاب فعلی ادیتور هم‌خوان باشد.
   */
  const readSelection = () => {
    const attributes = editor.getAttributes('link') as {
      href?: string;
      target?: string;
    };

    const { from, to, empty } = editor.state.selection;

    setHref(attributes.href ?? '');
    setNewTab(attributes.target === '_blank');
    setText(empty ? '' : editor.state.doc.textBetween(from, to, ' ').trim());
  };

  const handleOpenChange = (next: boolean) => {
    if (next) readSelection();

    setOpen(next);
  };

  const apply = () => {
    const url = normalizeUrl(href);
    const target = newTab ? '_blank' : null;

    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setOpen(false);
      return;
    }

    if (editor.state.selection.empty && text.trim()) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: text.trim(),
          marks: [{ type: 'link', attrs: { href: url, target } }],
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url, target })
        .run();
    }

    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <span className="inline-flex">
            <ToolbarButton title="درج/ویرایش لینک (Ctrl+K)" active={open || isLink}>
              <Link2 className="size-4" />
            </ToolbarButton>
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 gap-3 p-3" dir="rtl">
        <div className="space-y-1.5">
          <label className="block text-xs text-neutral-600" htmlFor="zp-link-href">
            آدرس لینک
          </label>
          <Input
            id="zp-link-href"
            value={href}
            dir="ltr"
            placeholder="https://example.com یا /product/…"
            onChange={event => setHref(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                apply();
              }
            }}
            className="h-8 bg-white text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs text-neutral-600" htmlFor="zp-link-text">
            متن لینک {editor.state.selection.empty ? '' : '(اختیاری)'}
          </label>
          <Input
            id="zp-link-text"
            value={text}
            placeholder={
              editor.state.selection.empty
                ? 'متنی که لینک می‌شود'
                : 'متن انتخاب‌شده'
            }
            onChange={event => setText(event.target.value)}
            className="h-8 bg-white text-xs"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-600">
          <Switch checked={newTab} onCheckedChange={setNewTab} />
          در تب جدید باز شود
        </label>

        <div className="flex items-center gap-2 border-t border-neutral-100 pt-3">
          <Button type="button" variant="dark" size="sm" onClick={apply}>
            اعمال
          </Button>

          {isLink && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  editor.chain().focus().extendMarkRange('link').unsetLink().run();
                  setOpen(false);
                }}
              >
                <Unlink className="size-3.5" />
                حذف لینک
              </Button>

              <a
                href={normalizeUrl(
                  (editor.getAttributes('link') as { href?: string }).href ?? '',
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="ms-auto flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
              >
                <ExternalLink className="size-3.5" />
                باز کردن
              </a>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
