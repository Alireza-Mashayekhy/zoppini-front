'use client';

import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * دکمه‌های نوار ابزار ادیتور.
 *
 * همه یک شکل و اندازه‌اند تا نوار ابزار شلوغ نشود؛ وضعیت فعال با
 * پس‌زمینه‌ی تیره مشخص می‌شود و راهنمای فارسی در `title` است.
 */
export function ToolbarButton({
  children,
  onClick,
  active = false,
  disabled = false,
  title,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active || undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900',
        'disabled:pointer-events-none disabled:opacity-30',
        active && 'bg-neutral-900 text-white hover:bg-neutral-900 hover:text-white',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** دکمه‌ی متنی نوار ابزار (برای مواردی که آیکون کافی نیست) */
export function ToolbarTextButton({
  children,
  onClick,
  active = false,
  disabled = false,
  title,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-8 shrink-0 items-center gap-1 rounded px-2 text-xs text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900',
        'disabled:pointer-events-none disabled:opacity-30',
        active && 'bg-neutral-900 text-white hover:bg-neutral-900 hover:text-white',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** جداکننده‌ی گروه‌های نوار ابزار */
export function ToolbarDivider({ className }: { className?: string }) {
  return <span className={cn('mx-0.5 h-5 w-px shrink-0 bg-neutral-200', className)} />;
}

/** یک گروه منطقی از دکمه‌ها */
export function ToolbarGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex shrink-0 items-center gap-0.5', className)}>
      {children}
    </div>
  );
}
