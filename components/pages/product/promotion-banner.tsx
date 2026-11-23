/**
 * بنر پروموشن صفحهٔ محصول (کمپین بلک‌فرایدی).
 *
 * این کامپوننت فقط «نمایش» است: هیچ محاسبهٔ قیمت، صلاحیت، دامنه یا انباشت
 * تخفیفی در آن انجام نمی‌شود. نام پروموشن و درصد تخفیف از دادهٔ واقعی بک‌اند
 * (`product.promotionBadges[].name / rewardType / rewardValue`) می‌آید و اگر
 * درصد معتبر نباشد، بنر اصلاً رندر نمی‌شود.
 */
export type ProductPromotionBannerProps = {
  /** نام واقعی پروموشن از بک‌اند (فقط برای برچسب دسترس‌پذیری) */
  name: string;
  /** مقدار پاداش درصدی پروموشن از بک‌اند */
  percent: number;
};

export default function ProductPromotionBanner({
  name,
  percent,
}: ProductPromotionBannerProps) {
  const safePercent =
    Number.isFinite(percent) && percent > 0
      ? Math.round(percent * 10) / 10
      : null;

  // بدون درصد معتبر هیچ بنری رندر نمی‌شود (هیچ عددی هاردکد نمی‌شود)
  if (safePercent === null) return null;

  const percentFa = safePercent.toLocaleString('fa-IR');

  return (
    <section
      dir="rtl"
      aria-label={`${name}: ${percentFa}٪ تخفیف بیشتر`}
      data-testid="product-promotion-banner"
      className="mt-4 overflow-hidden rounded-2xl bg-[#A9142D] px-4 py-4 text-white shadow-[0_18px_40px_-28px_rgba(169,20,45,0.85)] ring-1 ring-inset ring-white/15 sm:px-6 sm:py-5"
    >
      <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <span className="shrink-0 whitespace-nowrap rounded-md bg-black px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-white sm:px-3.5 sm:py-2 sm:text-sm">
          BLACK FRIDAY
        </span>

        <div className="w-full min-w-0 lg:w-auto">
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-3xl leading-none font-extrabold text-white sm:text-4xl">
              {percentFa}٪
            </span>
            <span className="text-base font-bold text-white sm:text-lg">
              تخفیف بیشتر
            </span>
          </p>
          <p className="mt-1.5 text-xs leading-6 text-white/90 sm:text-sm">
            تخفیف ویژه سبد خرید شما
          </p>
        </div>
      </div>
    </section>
  );
}
