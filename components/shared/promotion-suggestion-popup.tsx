'use client';

import { Gift, Loader2, ShoppingBag, Sparkles, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { useAddToCart } from '@/services/features/cart/hooks';
import { markPopupShown } from '@/services/features/promotions/api';
import {
  useAddPromotionReward,
  useCartPromotionSuggestions,
  useDismissPromotion,
  useSelectPromotionReward,
} from '@/services/features/promotions/hooks';
import { PromotionSuggestionView } from '@/services/features/promotions/types';
import { useCartStore } from '@/store/cart.store';

import {
  resolveSuggestionButton,
  shouldShowSuggestion,
} from './promotion-suggestion-action';
import PromotionVariantPicker from './promotion-variant-picker';

/**
 * کارت پیشنهاد «پیش از سبد».
 *
 * چرا کارت و نه مودال: این پیشنهاد مزاحم نباید صفحه را قفل کند. مشتری باید
 * بتواند به خرید ادامه دهد و در صورت تمایل هدیه را بگیرد. کارت پایین صفحه
 * می‌نشیند، روی محتوای اصلی نمی‌افتد و با یک کلیک بسته می‌شود.
 *
 * رفتارها:
 * - وقتی کشوی سبد باز است نمایش داده نمی‌شود (روی کشو می‌افتد).
 * - برای هر «وضعیت سبد» (stateKey) فقط یک‌بار؛ با تغییر تعداد کالاهای واجد
 *   شرط، stateKey عوض می‌شود و پیشنهاد تازه دوباره شانس نمایش دارد.
 * - «نه ممنون» پروموشن را برای سبد جاری خاموش می‌کند.
 * - هیچ کالای پولی ساکت اضافه نمی‌شود: اقدام از `action` سرور گرفته می‌شود
 *   و کالای پولی هرگز از مسیر هدیهٔ رایگان اضافه نمی‌شود.
 */
export default function PromotionSuggestionPopup() {
  const { openCart, isOpen } = useCartStore();

  /*
   * پیشنهادها سرور-محور هستند و برای سبد مهمان هم کار می‌کنند (سرور با
   * guestId همان سبد را می‌شناسد)؛ پس نمایش را به ورود مشتری گره نمی‌زنیم.
   */
  const { data } = useCartPromotionSuggestions();

  const addReward = useAddPromotionReward();
  const selectReward = useSelectPromotionReward();
  const addPaidItem = useAddToCart();
  const dismiss = useDismissPromotion();

  const suggestions = useMemo(
    () => data?.data?.suggestions ?? [],
    [data?.data?.suggestions],
  );

  const [pickerOpen, setPickerOpen] = useState(false);

  const popupShownFor = data?.data?.popupShownFor ?? null;
  const acceptedPromotions = data?.data?.acceptedPromotions ?? [];

  /**
   * وضعیت‌هایی که در همین نشست بسته شده‌اند؛ تا پروموشن تازهٔ دیگری سر نرسد،
   * جلوی باز شدن دوبارهٔ همان کارت را می‌گیرند.
   */
  const [closedStateKey, setClosedStateKey] = useState<string | null>(null);

  const first = suggestions[0] ?? null;

  const active: PromotionSuggestionView | null =
    !isOpen &&
    !acceptedPromotions.includes(first?.promotionId ?? -1) &&
    shouldShowSuggestion(first, {
      popupShownFor,
      dismissedStateKey: closedStateKey,
      dismissedPromotionIds: [],
    })
      ? first
      : null;

  const activeStateKey = active?.stateKey ?? null;

  useEffect(() => {
    // ثبت این‌که پیشنهاد برای این وضعیت سبد دیده شد (برای تکرارنشدن)
    if (activeStateKey) {
      void markPopupShown(activeStateKey).catch(() => undefined);
    }
  }, [activeStateKey]);

  if (!active) {
    return null;
  }

  const close = () => {
    setClosedStateKey(active.stateKey);
  };

  const button = resolveSuggestionButton(active);

  const handleDismiss = () => {
    close();

    dismiss.mutate(active.promotionId, {
      onError: () => toast.error('انصراف ثبت نشد. دوباره تلاش کنید.'),
    });
  };

  /**
   * اقدام اصلی بر اساس `action` سرور:
   *
   * - add_free_reward → هدیهٔ رایگان از مسیر پاداش (قیمت صفر)
   * - add_paid_item  → کالای پولی برای کامل شدن شرط، با قیمت عادی و از
   *   مسیر سبد معمولی؛ هرگز از مسیر پاداش (که کالا را رایگان می‌کند)
   * - open_cart      → فقط سبد باز می‌شود و مشتری خودش انتخاب می‌کند
   */
  const handleAccept = () => {
    if (!button.addsItem) {
      close();
      openCart();

      return;
    }

    if (!button.free) {
      const variantId = active.suggestedProduct?.variantId;

      if (!variantId) {
        // انتخاب از دستهٔ پیشنهادی؛ قیمت واقعی همان‌جا نمایش داده می‌شود
        setPickerOpen(true);

        return;
      }

      addPaidItem.mutate(
        { variantId, quantity: 1 },
        {
          onSuccess: () => {
            close();
            openCart();
            toast.success('کالا به سبد اضافه شد.');
          },
          onError: () => toast.error('افزودن کالا انجام نشد.'),
        },
      );

      return;
    }

    if (active.requiresSelection || !active.suggestedProduct?.variantId) {
      // کالای هدیه باید انتخاب شود؛ انتخابگر واریانت باز می‌شود
      setPickerOpen(true);

      return;
    }

    addReward.mutate(
      {
        promotionId: active.promotionId,
        variantId: active.suggestedProduct.variantId ?? undefined,
        productId: active.suggestedProduct.productId,
        quantity: 1,
      },
      {
        onSuccess: () => {
          close();
          openCart();
          toast.success('کالای هدیه به سبد اضافه شد.');
        },
        onError: () =>
          toast.error('افزودن هدیه انجام نشد. احتمالاً موجودی تمام شده است.'),
      },
    );
  };

  const dismissLabel = active.dismissLabel?.trim() || 'نه ممنون';
  const isPending =
    addReward.isPending || selectReward.isPending || addPaidItem.isPending;

  return (
    <>
      <aside
        dir="rtl"
        role="complementary"
        aria-label={active.title}
        data-testid="promotion-suggestion-popup"
        className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-lg border bg-white shadow-xl sm:inset-x-auto sm:left-4 sm:bottom-4"
      >
        <div className="flex items-start gap-2 p-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#ad2e38]/10 text-[#ad2e38]">
            <Sparkles className="size-4" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900">{active.title}</p>

            {active.description && (
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                {active.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="بستن پیشنهاد"
            className="shrink-0 text-muted-foreground hover:text-gray-900"
          >
            <X className="size-4" />
          </button>
        </div>

        {active.suggestedProduct && (
          <div className="mx-3 flex items-center gap-3 border bg-[#faf9f8] p-2">
            <div className="relative size-12 shrink-0 overflow-hidden bg-white">
              {active.suggestedProduct.image ? (
                <Image
                  src={
                    process.env.NEXT_PUBLIC_IMAGE_URL +
                    active.suggestedProduct.image
                  }
                  alt={active.suggestedProduct.title ?? 'کالای پیشنهادی'}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <ShoppingBag className="size-5" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">
                {active.suggestedProduct.title ?? 'کالای پیشنهادی'}
              </p>

              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px]">
                {button.free && active.rewardIsFree ? (
                  <>
                    <span className="inline-flex items-center gap-1 bg-green-50 px-1.5 py-0.5 font-semibold text-green-700">
                      <Gift className="size-3" />
                      رایگان
                    </span>

                    {!!active.suggestedProduct.price && (
                      <del className="text-muted-foreground">
                        {formatPrice(active.suggestedProduct.price)} تومان
                      </del>
                    )}
                  </>
                ) : (
                  active.suggestedProduct.price != null && (
                    <span className="font-medium">
                      {formatPrice(active.suggestedProduct.price)} تومان
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        <p className="px-3 pt-2 text-[11px] leading-5 text-muted-foreground">
          {active.hint}
        </p>

        {button.free && active.rewardIsFree && (
          <p className="px-3 pt-1 text-[11px] font-medium text-green-700">
            با تأیید شما این کالا <strong>رایگان</strong> به سبد اضافه می‌شود.
          </p>
        )}

        {!button.free && button.addsItem && (
          <p className="px-3 pt-1 text-[11px] font-medium text-amber-700">
            کالا با قیمت عادی اضافه می‌شود؛ تخفیف پس از کامل شدن شرط در سبد
            اعمال می‌شود.
          </p>
        )}

        <div className="flex items-center gap-2 p-3 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDismiss}
            disabled={dismiss.isPending}
            data-testid="promotion-popup-dismiss"
            className="flex-1"
          >
            {dismissLabel}
          </Button>

          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isPending}
            data-testid="promotion-popup-accept"
            className="flex-1"
          >
            {isPending ? (
              <Loader2 className="ml-1.5 size-3.5 animate-spin" />
            ) : (
              <Gift className="ml-1.5 size-3.5" />
            )}
            {button.label}
          </Button>
        </div>
      </aside>

      {pickerOpen && (
        <PromotionVariantPicker
          open={pickerOpen}
          onOpenChange={open => {
            setPickerOpen(false);

            if (!open) {
              close();
            }
          }}
          promotionId={active.promotionId}
          mode={button.free ? 'reward' : 'paid'}
          productId={active.suggestedProduct?.productId ?? null}
          categoryId={active.suggestedCategoryId ?? null}
          title={active.title}
          onSelected={() => {
            close();
            openCart();
          }}
        />
      )}
    </>
  );
}
