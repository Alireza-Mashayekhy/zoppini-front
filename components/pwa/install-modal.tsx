'use client';

import {
  Check,
  MonitorDown,
  PlusSquare,
  Share,
  Smartphone,
  X,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Platform } from '@/lib/pwa/platform';

interface Props {
  open: boolean;
  platform: Platform;
  hasPrompt: boolean;
  onDismiss: () => void;
  onInstall: () => void;
}
export default function InstallModal({
  open,
  platform,
  hasPrompt,
  onDismiss,
  onInstall,
}: Props) {
  const ios = platform.startsWith('ios');
  const macSafari = platform === 'mac-safari';
  const mobile = ios || platform === 'android';
  const title = ios
    ? 'زوپینی را متفاوت تجربه کنید'
    : mobile
      ? 'زوپینی، همیشه همراه شما'
      : 'زوپینی، همیشه در دسترس';
  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        if (!value) onDismiss();
      }}
    >
      <DialogContent
        dir="rtl"
        showCloseButton={false}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-none bg-[#f9f9f9] p-0 ring-black/10 sm:max-w-[440px] motion-reduce:!animate-none"
      >
        <div className="px-6 pb-7 pt-7 sm:px-9 sm:pb-9 sm:pt-9">
          <button
            type="button"
            onClick={onDismiss}
            aria-label="بستن پنجره نصب"
            className="absolute left-5 top-5 flex size-10 items-center justify-center text-neutral-500 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black motion-reduce:transition-none"
          >
            <X size={20} aria-hidden="true" />
          </button>
          <div className="flex items-center gap-3 border-b border-black/10 pb-6">
            <div className="flex size-12 items-center justify-center border border-black/10 bg-white text-neutral-800">
              {mobile ? (
                <Smartphone size={21} strokeWidth={1.4} aria-hidden="true" />
              ) : (
                <MonitorDown size={21} strokeWidth={1.4} aria-hidden="true" />
              )}
            </div>
            <div>
              <span
                dir="ltr"
                className="block text-[11px] font-semibold tracking-[0.22em] text-neutral-900"
              >
                ZOPPINI
              </span>
              <span className="mt-1 block text-[11px] text-neutral-500">
                تجربه‌ای نزدیک‌تر
              </span>
            </div>
          </div>
          <DialogTitle className="mt-7 text-right text-xl font-semibold leading-9 text-neutral-900 sm:text-2xl">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-right text-sm leading-7 text-neutral-500">
            {ios
              ? 'زوپینی را به صفحه اصلی اضافه کنید و تجربه خریدی سریع و آسان داشته باشید.'
              : macSafari
                ? 'زوپینی را به Dock اضافه کنید تا مانند یک برنامه مستقل به آن دسترسی داشته باشید.'
                : mobile
                  ? 'تجربه خرید زوپینی را روی دستگاه خود نصب کنید.'
                  : 'با نصب زوپینی، تجربه خرید را مستقیماً از دسکتاپ خود دنبال کنید.'}
          </DialogDescription>
          {ios && (
            <ol className="mt-6 space-y-0 border-y border-black/10 text-sm text-neutral-700">
              <Step icon={<Share size={19} strokeWidth={1.5} />} number="۱">
                {platform === 'ios-safari'
                  ? 'در مرورگر، دکمه اشتراک‌گذاری را لمس کنید.'
                  : 'در مرورگر، دکمه اشتراک‌گذاری را لمس کنید؛ اگر آن را نمی‌بینید، از منوی مرورگر Share را انتخاب کنید.'}
              </Step>
              <Step
                icon={<PlusSquare size={19} strokeWidth={1.5} />}
                number="۲"
              >
                در فهرست، گزینه «Add to Home Screen» را انتخاب کنید.
              </Step>
              <Step icon={<Check size={19} strokeWidth={1.5} />} number="۳">
                برای تکمیل نصب، «Add» را لمس کنید.
              </Step>
            </ol>
          )}
          {macSafari && (
            <div className="mt-6 border-y border-black/10 py-4 text-sm leading-7 text-neutral-700">
              در Safari، از منوی{' '}
              <span dir="ltr" className="inline-block">
                File
              </span>{' '}
              گزینه{' '}
              <span dir="ltr" className="inline-block">
                Add to Dock
              </span>{' '}
              را انتخاب و تأیید کنید. این قابلیت به macOS Sonoma یا جدیدتر نیاز
              دارد.
            </div>
          )}
          {(ios || macSafari) && (
            <p className="mt-4 text-xs leading-6 text-neutral-500">
              نصب به صورت دستی و از طریق مرورگر انجام می‌شود.
            </p>
          )}
          {!ios && !macSafari && hasPrompt && (
            <button
              type="button"
              onClick={onInstall}
              className="mt-7 flex min-h-12 w-full items-center justify-center bg-neutral-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black motion-reduce:transition-none"
            >
              نصب زوپینی
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="mt-4 block w-full py-2 text-center text-xs text-neutral-500 underline underline-offset-4 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            بعداً
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function Step({
  icon,
  number,
  children,
}: {
  icon: React.ReactNode;
  number: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 border-b border-black/10 py-3 last:border-0">
      <span className="text-xs text-neutral-400">{number}</span>
      <span
        className="flex size-9 shrink-0 items-center justify-center border border-black/10 text-neutral-700"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="leading-6">{children}</span>
    </li>
  );
}
