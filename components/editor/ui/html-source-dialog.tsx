'use client';

import type { Editor } from '@tiptap/core';
import { Braces, Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

/**
 * نمای کد HTML — معادل تب «متن» در ادیتور کلاسیک وردپرس.
 *
 * ادمین می‌تواند HTML خام را ببیند، دستی ویرایش کند و نتیجه را به
 * ادیتور برگرداند. برای چسباندن کدهای embed یا اصلاح سریع markup مفید است.
 */
export default function HtmlSourceDialog({
  open,
  onOpenChange,
  editor,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: Editor;
}) {
  const [html, setHtml] = useState('');
  /** آیا برای وضعیت فعلی (باز/بسته) محتوا خوانده شده است؟ */
  const [synced, setSynced] = useState(false);

  /**
   * هر بار دیالوگ باز می‌شود، آخرین HTML ادیتور خوانده می‌شود.
   * این هم‌زمان‌سازی داخل خود رندر انجام می‌شود (الگوی رسمی ری‌اکت برای
   * تنظیم state بر اساس prop) تا رندر اضافه‌ی بعد از mount لازم نباشد.
   */
  if (synced !== open) {
    setSynced(open);
    if (open) setHtml(formatHtml(editor.getHTML()));
  }

  const apply = () => {
    editor.chain().focus().setContent(html, { emitUpdate: true }).run();
    onOpenChange(false);
    toast.success('HTML اعمال شد');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      toast.success('کد HTML کپی شد');
    } catch {
      toast.error('کپی ناموفق بود');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Braces className="size-4" />
            کد HTML مقاله
          </DialogTitle>
        </DialogHeader>

        <Textarea
          value={html}
          onChange={event => setHtml(event.target.value)}
          dir="ltr"
          spellCheck={false}
          rows={18}
          className="bg-neutral-50 font-mono text-xs leading-6"
        />

        <p className="text-[11px] text-neutral-400">
          تغییرات فقط بعد از زدن «اعمال» در ادیتور اعمال می‌شود. بلوک‌های
          ویژه (اسلایدر، گالری، سوالات متداول و فهرست) به‌شکل
          <code dir="ltr" className="mx-1 rounded bg-neutral-100 px-1">
            &lt;div data-zp-block=&quot;…&quot; data-zp-config=&quot;…&quot;&gt;
          </code>
          ذخیره می‌شوند؛ آن‌ها را دستی جابه‌جا نکنید.
        </p>

        <div className="flex items-center gap-2 border-t border-neutral-100 pt-3">
          <Button type="button" variant="outline" size="sm" onClick={copy}>
            <Copy className="size-3.5" />
            کپی کد
          </Button>

          <div className="ms-auto flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>
            <Button type="button" variant="dark" size="sm" onClick={apply}>
              <Check className="size-3.5" />
              اعمال
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** تورفتگی ساده برای خوانایی HTML خام (بدون تغییر محتوا) */
function formatHtml(html: string): string {
  return html
    .replace(/></g, '>\n<')
    .split('\n')
    .filter(line => line.trim().length > 0)
    .join('\n');
}
