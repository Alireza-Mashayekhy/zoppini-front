'use client';

import { Check, Eraser } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { ToolbarButton } from './toolbar-button';

/**
 * انتخابگر رنگ نوار ابزار.
 *
 * یک پالت آماده (رنگ‌های برند و خنثی) به‌همراه انتخابگر رنگ دلخواه و
 * دکمه‌ی «حذف رنگ». هم برای رنگ متن و هم برای هایلایت استفاده می‌شود.
 */
export default function ColorMenu({
  title,
  icon,
  colors,
  current,
  onPick,
  onClear,
}: {
  title: string;
  icon: ReactNode;
  colors: readonly string[];
  current?: string | null;
  onPick: (color: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('#b8895a');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span className="relative inline-flex">
          <ToolbarButton title={title} active={open} className="flex-col gap-0">
            <span className="flex items-center">{icon}</span>
            <span
              className="mt-0.5 h-1 w-4 rounded-sm"
              style={{ backgroundColor: current ?? 'transparent' }}
            />
          </ToolbarButton>
        </span>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-56 gap-3 p-3" dir="rtl">
        <div className="grid grid-cols-5 gap-1.5">
          {colors.map(color => (
            <button
              key={color}
              type="button"
              title={color}
              onClick={() => {
                onPick(color);
                setOpen(false);
              }}
              className={cn(
                'flex size-8 items-center justify-center rounded border border-neutral-200 transition-transform hover:scale-105',
                current?.toLowerCase() === color.toLowerCase() &&
                  'ring-2 ring-neutral-900 ring-offset-1',
              )}
              style={{ backgroundColor: color }}
            >
              {current?.toLowerCase() === color.toLowerCase() && (
                <Check className="size-4 text-white mix-blend-difference" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-neutral-100 pt-3">
          <label className="flex items-center gap-2 text-xs text-neutral-600">
            رنگ دلخواه
            <input
              type="color"
              value={custom}
              onChange={event => setCustom(event.target.value)}
              className="size-7 cursor-pointer rounded border border-neutral-200 bg-white p-0.5"
            />
          </label>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ms-auto"
            onClick={() => {
              onPick(custom);
              setOpen(false);
            }}
          >
            اعمال
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start text-neutral-600"
          onClick={() => {
            onClear();
            setOpen(false);
          }}
        >
          <Eraser className="size-3.5" />
          حذف رنگ
        </Button>
      </PopoverContent>
    </Popover>
  );
}
