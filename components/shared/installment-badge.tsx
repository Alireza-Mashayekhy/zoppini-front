import { cn } from '@/lib/utils';

/**
 * نشان «خرید اقساطی ۴ مرحله‌ای اسنپ‌پی» که در پایین‌ترین لبهٔ کارت محصول می‌نشیند.
 *
 * فقط اطلاع‌رسانی است و هیچ مبلغی را وعده نمی‌دهد: اسنپ‌پی اهلیت هر سبد را
 * به‌صورت داینامیک و بر اساس مبلغ نهایی (`/online/offer/v1/eligible`) تعیین
 * می‌کند، پس نوشتن «هر قسط X تومان» در کارت محصول می‌توانست گمراه‌کننده باشد.
 * متن برای همهٔ کارت‌ها یکسان است تا ارتفاع ردیف‌های گرید یکدست بماند.
 */
export default function InstallmentBadge({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        // mt-auto نوار را روی لبهٔ پایین کارت نگه می‌دارد، حتی وقتی محتوای
        // کارت‌های یک ردیف گرید ارتفاع متفاوت داشته باشد.
        'mt-auto flex w-full items-center justify-center border-t border-[#f0e6f9] bg-[#faf6fe] px-3 py-2 text-center text-[10px] font-medium leading-4 text-[#6b21a8] sm:text-[11px]',
        className,
      )}
    >
      خرید اقساطی ۴ مرحله‌ای اسنپ‌پی
    </div>
  );
}
