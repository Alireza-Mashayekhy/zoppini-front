// components/layout/cart.tsx
'use client';

import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCartList,
  useClearCart,
  useDeleteCartItem,
  useUpdateCartItem,
} from '@/services/features/cart/hooks';
import { CartItem } from '@/services/features/cart/types';
import { useCartStore } from '@/store/cart.store';

export default function Cart() {
  const { isOpen, closeCart, openCart } = useCartStore();
  const { data, isLoading } = useCartList({ enabled: isOpen });
  const updateItem = useUpdateCartItem();
  const deleteItem = useDeleteCartItem();
  const clearCart = useClearCart();

  const cartItems = data?.data?.items || [];

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      deleteItem.mutate({ id: itemId });
    } else {
      updateItem.mutate({ id: itemId, data: { quantity: newQuantity } });
    }
  };

  const handleClear = () => {
    clearCart.mutate();
  };

  return (
    <>
      {/* دکمه باز کردن سبد خرید */}
      <Button variant="ghost" size="icon" onClick={openCart}>
        <ShoppingBag className="size-4 md:size-5" />
      </Button>

      {/* شیت سبد خرید */}
      <Sheet open={isOpen} onOpenChange={closeCart}>
        <SheetContent
          side="left"
          className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-x-hidden bg-popover p-0 data-[side=left]:h-[100dvh]! data-[side=left]:w-full! data-[side=left]:max-w-none! sm:data-[side=left]:w-[26rem]! sm:data-[side=left]:max-w-[26rem]!"
        >
          <SheetHeader className="shrink-0 border-b p-4 pe-12">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              سبد خرید
              <span className="text-sm font-normal text-gray-500">
                ({cartItems.length} آیتم)
              </span>
            </SheetTitle>
          </SheetHeader>

          {/* لیست آیتم‌ها؛ تنها همین ناحیه اسکرول می‌شود تا خلاصه و دکمهٔ
              تسویه همیشه پایین شیت و بیرون از ناحیهٔ اسکرول بمانند. */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-20 h-20 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))
            ) : cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ShoppingBag className="w-16 h-16 mb-4 stroke-1" />
                <p>سبد خرید شما خالی است</p>
                <Button variant="link" onClick={closeCart} className="mt-2">
                  ادامه خرید
                </Button>
              </div>
            ) : (
              cartItems.map(item => (
                <div
                  key={item.id}
                  className="grid grid-cols-[4.5rem_minmax(0,1fr)_2.75rem] items-start gap-x-3 border-b pb-4 last:border-0"
                  dir="rtl"
                >
                  <Link
                    href={`/product/${item.variant.product.slug}`}
                    className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-md bg-gray-100"
                    onClick={closeCart}
                  >
                    <Image
                      src={
                        process.env.NEXT_PUBLIC_IMAGE_URL +
                        item.variant.product.image
                      }
                      alt={item.variant.product.title}
                      fill
                      className="object-cover"
                    />
                  </Link>

                  <div className="min-w-0">
                    <Link
                      href={`/product/${item.variant.product.slug}`}
                      className="block break-words text-sm font-medium leading-6 hover:underline"
                      onClick={closeCart}
                    >
                      {item.variant.product.title}
                    </Link>
                    <div className="mt-0.5 break-words text-xs leading-5 text-gray-500">
                      {item.variant.color?.name}
                      {item.variant.size?.name
                        ? ` / ${item.variant.size.name}`
                        : ''}
                    </div>

                    {/* تعداد در یک گروه فشرده و مستقل؛ قیمت در خط بعدی و
                        دقیقاً زیر همین کنترل‌ها می‌آید. */}
                    <div className="mt-2 flex items-center">
                      <div className="inline-flex items-center overflow-hidden rounded-md border">
                        <button
                          type="button"
                          aria-label="کاهش تعداد"
                          className="flex h-11 w-11 items-center justify-center hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/30 disabled:opacity-40"
                          disabled={updateItem.isPending}
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <span className="w-9 text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="افزایش تعداد"
                          className="flex h-11 w-11 items-center justify-center hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/30 disabled:opacity-40"
                          disabled={updateItem.isPending}
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-1.5 min-w-0 text-right">
                      <CartLinePrice item={item} />
                      {!item.promotion?.isFreeReward &&
                        item.promotion?.labels?.map(label => (
                          <span
                            key={label}
                            className="mt-1 block text-[10px] font-medium leading-4 text-green-700"
                          >
                            {label}
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* حذف در ستون سمت چپ فیزیکی؛ ستون عرض ثابت دارد تا همهٔ
                      دکمه‌های حذف، مستقل از طول عنوان، هم‌تراز بمانند. */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="حذف از سبد خرید"
                    title="حذف از سبد خرید"
                    className="h-11 w-11 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                    disabled={deleteItem.isPending}
                    onClick={() => deleteItem.mutate({ id: item.id })}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* پایین سایدبار */}
          {cartItems.length > 0 && (
            <div className="shrink-0 space-y-3 border-t bg-popover p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="flex justify-between text-sm">
                <span>قیمت</span>
                <span className="font-semibold">
                  {data?.data?.pricing?.originalPrice.toLocaleString()} تومان
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>تخفیف</span>
                <span className="font-semibold">
                  {(
                    (data?.data?.pricing?.discountPrice ?? 0) +
                    (data?.data?.pricing?.promotionDiscountPrice ?? 0)
                  ).toLocaleString()}{' '}
                  تومان
                </span>
              </div>

              {(data?.data?.pricing?.freeItemValue ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>کالای رایگان</span>
                  <span className="font-semibold">
                    {data?.data?.pricing?.freeItemValue?.toLocaleString()} تومان
                  </span>
                </div>
              )}

              {!!data?.data?.pricing?.freeShipping && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>ارسال</span>
                  <span className="font-semibold">رایگان</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span>جمع کل</span>
                <span className="font-semibold">
                  {data?.data?.pricing?.finalPrice.toLocaleString()} تومان
                </span>
              </div>

              {!!data?.data?.promotions?.notices?.length && (
                <ul className="space-y-1 border-t pt-3">
                  {data.data.promotions.notices.map(notice => (
                    <li
                      key={notice}
                      className="text-[11px] leading-5 text-amber-700"
                    >
                      {notice}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <AlertDialog>
                  <AlertDialogTrigger>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={clearCart.isPending}
                    >
                      {clearCart.isPending ? 'در حال پاک کردن...' : 'خالی کردن'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl" className="rounded-none">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        آیا از خالی کردن سبد خرید مطمئنید؟
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        این عملیات قابل برگشت نیست
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>انصراف</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => handleClear()}
                      >
                        خالی کردن{' '}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button className="flex-1" variant="dark" asChild>
                  <Link href="/checkout" onClick={closeCart}>
                    تسویه حساب
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

/**
 * قیمت یک ردیف سبد.
 *
 * منبع عدد، فیلد `payableTotal` سرور است (پس از فروش ویژه و سهم پروموشن)،
 * نه محاسبهٔ دوباره در کلاینت؛ تا جمع ردیف‌ها همیشه با جمع کل سبد بخواند.
 * برای ردیف هدیه، مبلغ صفر با برچسب «رایگان» و قیمت قبل از تخفیف خط‌خورده
 * نمایش داده می‌شود.
 */
function CartLinePrice({ item }: { item: CartItem }) {
  const listTotal = Number(item.variant.price) * item.quantity;

  const payableTotal =
    item.payableTotal ??
    (item.promotion?.isFreeReward
      ? 0
      : item.payablePrice != null
        ? Number(item.payablePrice) * item.quantity
        : listTotal);

  if (item.promotion?.isFreeReward) {
    return (
      <div className="flex flex-col items-start text-right">
        <span className="bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
          رایگان
        </span>
        <del className="whitespace-nowrap text-[11px] text-gray-400">
          <bdi>{listTotal.toLocaleString('fa-IR')}</bdi> تومان
        </del>
      </div>
    );
  }

  const discounted = payableTotal !== listTotal;

  return (
    <div className="flex flex-col items-start text-right">
      {discounted && (
        <span className="whitespace-nowrap text-[13px] font-medium sm:text-sm">
          <bdi>{payableTotal.toLocaleString('fa-IR')}</bdi> تومان
        </span>
      )}

      <span
        className={
          discounted
            ? 'whitespace-nowrap text-[11px] font-medium line-through sm:text-xs'
            : 'whitespace-nowrap text-[13px] font-medium sm:text-sm'
        }
      >
        <bdi>{listTotal.toLocaleString('fa-IR')}</bdi> تومان
      </span>
    </div>
  );
}
