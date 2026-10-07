'use client';

import type { Editor } from '@tiptap/core';
import {
  Columns3,
  Merge,
  Rows3,
  Split,
  Table as TableIcon,
  Trash2,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ToolbarButton } from './toolbar-button';

/**
 * منوی جدول.
 *
 * درج جدول و همه‌ی عملیات سطر/ستون/سلول (مثل وردپرس) یک‌جا جمع شده و
 * گزینه‌های نامرتبط با وضعیت فعلی غیرفعال می‌شوند.
 */
export default function TableMenu({ editor }: { editor: Editor }) {
  const inTable = editor.isActive('table');

  const run = (command: () => boolean) => () => {
    command();
  };

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <span className="inline-flex">
          <ToolbarButton title="جدول" active={inTable}>
            <TableIcon className="size-4" />
          </ToolbarButton>
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-60">
        {!inTable && (
          <DropdownMenuItem
            onClick={run(
              () =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run(),
            )}
          >
            <TableIcon className="size-4" />
            درج جدول ۳×۳
          </DropdownMenuItem>
        )}

        {inTable && (
          <>
            <DropdownMenuLabel className="text-[11px] text-neutral-400">
              سطرها
            </DropdownMenuLabel>

            <DropdownMenuItem
              onClick={run(() => editor.chain().focus().addRowBefore().run())}
            >
              <Rows3 className="size-4" />
              افزودن سطر بالا
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={run(() => editor.chain().focus().addRowAfter().run())}
            >
              <Rows3 className="size-4" />
              افزودن سطر پایین
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={run(() => editor.chain().focus().deleteRow().run())}
            >
              <Trash2 className="size-4" />
              حذف سطر
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-[11px] text-neutral-400">
              ستون‌ها
            </DropdownMenuLabel>

            <DropdownMenuItem
              onClick={run(() => editor.chain().focus().addColumnBefore().run())}
            >
              <Columns3 className="size-4" />
              افزودن ستون قبل
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={run(() => editor.chain().focus().addColumnAfter().run())}
            >
              <Columns3 className="size-4" />
              افزودن ستون بعد
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={run(() => editor.chain().focus().deleteColumn().run())}
            >
              <Trash2 className="size-4" />
              حذف ستون
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-[11px] text-neutral-400">
              سلول‌ها
            </DropdownMenuLabel>

            <DropdownMenuItem
              onClick={run(() => editor.chain().focus().toggleHeaderRow().run())}
            >
              <Rows3 className="size-4" />
              سطر عنوان
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={run(() => editor.chain().focus().mergeOrSplit().run())}
            >
              <Split className="size-4" />
              ادغام / تقسیم سلول
            </DropdownMenuItem>

            <DropdownMenuItem
              disabled={!editor.can().mergeCells()}
              onClick={run(() => editor.chain().focus().mergeCells().run())}
            >
              <Merge className="size-4" />
              ادغام سلول‌های انتخابی
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onClick={run(() => editor.chain().focus().deleteTable().run())}
            >
              <Trash2 className="size-4" />
              حذف جدول
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
