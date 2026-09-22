'use client';

import {
  Ban,
  CircleOff,
  CircleSlash,
  Droplets,
  Flame,
  Hand,
  type LucideIcon,
  Shirt,
  TriangleAlert,
  WashingMachine,
  Wind,
} from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * علامت‌های شست‌وشو
 *
 * متن هر دستور جداگانه ذخیره می‌شود؛ این علامت فقط برای همان دستور
 * انتخاب یا عوض می‌شود.
 */
export const CARE_ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  'wash-30': { label: 'شست‌وشوی ماشینی ۳۰ درجه', Icon: WashingMachine },
  'wash-hand': { label: 'شست‌وشوی دستی', Icon: Hand },
  'wash-cold': { label: 'شست‌وشو با آب سرد', Icon: Droplets },
  'no-wash': { label: 'شست‌وشو نکنید', Icon: CircleSlash },
  'no-bleach': { label: 'سفیدکننده نزنید', Icon: TriangleAlert },
  'iron-low': { label: 'اتوی ملایم', Icon: Flame },
  'no-iron': { label: 'اتو نزنید', Icon: Ban },
  'dry-flat': { label: 'خشک‌کردن در سایه', Icon: Wind },
  'no-tumble': { label: 'خشک‌کن استفاده نکنید', Icon: CircleOff },
  'dry-clean': { label: 'خشک‌شویی', Icon: Shirt },
};

export function careIconLabel(iconKey?: string | null) {
  if (!iconKey) return null;

  return CARE_ICONS[iconKey]?.label ?? null;
}

export function CareIcon({
  iconKey,
  className,
}: {
  iconKey?: string | null;
  className?: string;
}) {
  const item = iconKey ? CARE_ICONS[iconKey] : undefined;

  if (!item) return null;

  const { Icon, label } = item;

  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-current/20 bg-black/[0.03]',
        className,
      )}
    >
      <Icon className="size-4.5" strokeWidth={1.6} />
    </span>
  );
}

export function CareIconPicker({
  value,
  onChange,
  className,
}: {
  value?: string | null;
  onChange: (iconKey: string | null) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          'rounded-lg border px-2 py-1 text-xs transition',
          !value
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border text-muted-foreground hover:border-primary/40',
        )}
      >
        بدون علامت
      </button>

      {Object.entries(CARE_ICONS).map(([key, item]) => {
        const { Icon, label } = item;
        const selected = value === key;

        return (
          <button
            key={key}
            type="button"
            title={label}
            aria-label={label}
            onClick={() => onChange(key)}
            className={cn(
              'flex size-9 items-center justify-center rounded-lg border transition',
              selected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40',
            )}
          >
            <Icon className="size-4.5" strokeWidth={1.6} />
          </button>
        );
      })}
    </div>
  );
}
