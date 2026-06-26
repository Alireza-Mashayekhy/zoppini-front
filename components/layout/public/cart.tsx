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
import { useCartStore } from '@/store/cart.store';

export default function Cart() {
  const { isOpen, closeCart, openCart } = useCartStore();
  const { data, isLoading } = useCartList();
  const updateItem = useUpdateCartItem();
  const deleteItem = useDeleteCartItem();
  const clearCart = useClearCart();

  const cartItems = data?.data?.items || [];

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.variant.price * item.quantity,
    0,
  );

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
        <ShoppingBag className="size-5" />
      </Button>

      {/* شیت سبد خرید */}
      <Sheet open={isOpen} onOpenChange={closeCart}>
        <SheetContent
          side="left"
          className="w-full max-w-[420px] p-0 flex flex-col"
        >
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              سبد خرید
              <span className="text-sm font-normal text-gray-500">
                ({cartItems.length} آیتم)
              </span>
            </SheetTitle>
          </SheetHeader>

          {/* لیست آیتم‌ها */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  className="flex gap-4 border-b pb-4 last:border-0"
                >
                  <Link
                    href={`/products/${item.variant.product.slug}`}
                    className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden bg-gray-100"
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
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.variant.product.slug}`}
                      className="font-medium text-sm hover:underline"
                      onClick={closeCart}
                    >
                      {item.variant.product.title}
                    </Link>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {item.variant.color?.name} / {item.variant.size?.name}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 border rounded-md">
                        <button
                          className="px-2 py-1 hover:bg-gray-100"
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          className="px-2 py-1 hover:bg-gray-100"
                          onClick={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {(
                            item.variant.price * item.quantity
                          ).toLocaleString()}{' '}
                          تومان
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                          onClick={() => deleteItem.mutate({ id: item.id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* پایین سایدبار */}
          {cartItems.length > 0 && (
            <div className="border-t p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>جمع کل</span>
                <span className="font-semibold">
                  {totalPrice.toLocaleString()} تومان
                </span>
              </div>
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
