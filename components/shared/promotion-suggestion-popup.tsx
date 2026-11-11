'use client';

import { Gift, Loader2, ShoppingBag, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
 * پاپ‌آپ پیشنهاد «پیش از سبد».
 *
 * رفتارها (عمداً محافظه‌کارانه):
 * - وقتی کشوی سبد باز است نمایش داده نمی‌شود (روی کشو می‌افتد)؛ پس از
 *   بستن کشو یا هنگام حضور در صفحهٔ تسویه فرصت نمایش دارد.
 * - برای هر «وضعیت سبد» (stateKey) فقط یک‌بار؛ با تغییر تعداد کالاهای واجد
 *   شرط، stateKey عوض می‌شود و پیشنهاد تازه دوباره شانس نمایش دارد.
 * - «نه ممنون» پیشنهاد را برای همان پروموشن خاموش می‌کند.
 * - هیچ کالای پولی ساکت اضافه نمی‌شود: کالای هدیه با برچسب «رایگان» و
 *   مبلغ صفر پیش از تأیید نمایش داده می‌شود.
 */
export default function PromotionSuggestionPopup() {
  const { openCart, isOpen } = useCartStore();

  /*
   * پیشنهادها سرور-محور هستند و برای سبد مهمان هم کار می‌کنند (سرور با
   * guestId همان سبد را می‌شناسد)؛ پس نمایش را به ورود مشتری گره نمی‌زنیم.
   */
  const { data } = useCartPromotionSuggestions();

  const addReward = useAddPromotionReward();
  const addPaidItem = useAddToCart();
  const selectReward = useSelectPromotionReward();
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
   * جلوی باز شدن دوبارهٔ همان پاپ‌آپ را می‌گیرند.
   */
  const [closedStateKey, setClosedStateKey] = useState<string | null>(null);

  /**
   * وقتی کشوی سبد باز است پاپ‌آپ را نشان نمی‌دهیم: روی کشو می‌افتد و
   * مزاحم می‌شود. با بستن کشو یا رفتن به تسویه، فرصت نمایش فراهم است.
   */
  const cartDrawerOpen = isOpen;

  const first = suggestions[0] ?? null;

  /*
   * «قبلاً برای این وضعیت سبد نشان داده شد؟» از سرور خوانده می‌شود تا با
   * رفرش صفحه هم پاپ‌آپ برنگردد. نمایش فعلی تا وقتی سبد تغییر نکند و
   * suggestions دوباره واکشی نشود، پایدار می‌ماند؛ واکشی دوباره فقط با
   * تغییر سبد رخ می‌دهد که همان لحظه، بسته شدن پاپ‌آپ رفتار درستی است.
   */
  const active: PromotionSuggestionView | null =
    !cartDrawerOpen &&
    !acceptedPromotions.includes(first?.promotionId ?? -1) &&
    shouldShowSuggestion(first, {
      popupShownFor,
      dismissedStateKey: closedStateKey,
      dismissedPromotionIds: [],
    })
      ? first
      : null;

  const activeStateKey = active?.stateKey ?? null;
  const activePromotionId = active?.promotionId ?? null;

  useEffect(() => {
    // ثبت این‌که پاپ‌آپ برای این وضعیت سبد دیده شد (برای تکرارنشدن)
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

  const handleDismiss = () => {
    close();

    dismiss.mutate(active.promotionId, {
      onError: () => toast.error('انصراف ثبت نشد. دوباره تلاش کنید.'),
    });
  };

  /**
   * اقدام اصلی پاپ‌آپ بر اساس `action` سرور تعیین می‌شود:
   *
   * - add_free_reward → هدیهٔ رایگان از مسیر پاداش (قیمت صفر)
   * - add_paid_item  → کالای پولی برای کامل شدن شرط، با قیمت عادی و از
   *   مسیر سبد معمولی؛ هرگز از مسیر پاداش (که کالا را رایگان می‌کند)
   * - open_cart      → فقط سبد را باز می‌کنیم و مشتری خودش انتخاب می‌کند
   *
   * این تفکیک جلوی یک اشتباه پرهزینه را می‌گیرد: افزودن کالای پولی با
   * endpoint پاداش باعث می‌شد کالا به‌عنوان «هدیه» ثبت و مبلغش صفر شود.
   */
  const handleAccept = () => {
    if (!button.addsItem) {
      close();
      openCart();

      return;
    }

    if (!button.free && button.addsItem) {
      const variantId = active.suggestedProduct?.variantId;

      if (!variantId) {
        // باید از دسته انتخاب شود؛ انتخابگر قیمت واقعی را نشان می‌دهد
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

    // مسیر پاداش رایگان: انتخاب واریانت در صورت نیاز
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

  const button = resolveSuggestionButton(active);
  const dismissLabel = active.dismissLabel?.trim() || 'نه ممنون';

  return (
    <>
      <Dialog open onOpenChange={value => !value && handleDismiss()}>
        <DialogContent
          className="max-w-md"
          dir="rtl"
          showCloseButton={false}
          data-testid="promotion-suggestion-popup"
          onEscapeKeyDown={event => {
            event.preventDefault();
            handleDismiss();
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-5 shrink-0 text-[#ad2e38]" />
              {active.title}
            </DialogTitle>

            {active.description && (
              <DialogDescription className="leading-6">
                {active.description}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {active.suggestedProduct && (
              <div className="flex items-center gap-3 border bg-[#faf9f8] p-3">
                <div className="relative size-16 shrink-0 overflow-hidden bg-white">
                  {active.suggestedProduct.image ? (
                    <Image
                      src={
                        process.env.NEXT_PUBLIC_IMAGE_URL +
                        active.suggestedProduct.image
                      }
                      alt={active.suggestedProduct.title ?? 'کالای پیشنهادی'}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ShoppingBag className="size-6" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {active.suggestedProduct.title ?? 'کالای پیشنهادی'}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    {button.free && active.rewardIsFree ? (
                      <>
                        <span className="inline-flex items-center gap-1 bg-green-50 px-2 py-0.5 font-semibold text-green-700">
                          <Gift className="size-3" />
                          رایگان
                        </span>

                        {!!active.suggestedProduct.price && (
                          <del className="text-muted-foreground">
                            {formatPrice(active.suggestedProduct.price)}
                          </del>
                        )}
                      </>
                    ) : (
                      active.suggestedProduct.price != null && (
                        <span className="font-medium">
                          {formatPrice(active.suggestedProduct.price)}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            <p className="bg-muted/50 p-3 text-xs leading-6 text-muted-foreground">
              {active.hint}
            </p>

            {button.free && active.rewardIsFree && (
              <p className="text-xs font-medium text-green-700">
                این کالا با تأیید شما به سبد اضافه می‌شود و مبلغ آن{' '}
                <strong>رایگان</strong> محاسبه می‌شود.
              </p>
            )}

            {active.action === 'add_paid_item' && (
              <p className="text-xs font-medium text-amber-700">
                این کالا با قیمت عادی به سبد اضافه می‌شود و برای کامل شدن شرط
                پیشنهاد لازم است؛ تخفیف پس از کامل شدن شرط در سبد اعمال می‌شود.
              </p>
            )}
          </div>

          <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={handleDismiss}
              disabled={dismiss.isPending}
              data-testid="promotion-popup-dismiss"
            >
              {dismissLabel}
            </Button>

            <Button
              onClick={handleAccept}
              disabled={
                addReward.isPending ||
                selectReward.isPending ||
                addPaidItem.isPending
              }
              data-testid="promotion-popup-accept"
            >
              {addReward.isPending ||
              selectReward.isPending ||
              addPaidItem.isPending ? (
                <Loader2 className="ml-2 size-4 animate-spin" />
              ) : (
                <Gift className="ml-2 size-4" />
              )}
              {button.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pickerOpen && activePromotionId != null && (
        <PromotionVariantPicker
          open={pickerOpen}
          onOpenChange={open => {
            setPickerOpen(false);

            if (!open) {
              close();
            }
          }}
          promotionId={activePromotionId}
          mode={active.action === 'add_paid_item' ? 'paid' : 'reward'}
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
