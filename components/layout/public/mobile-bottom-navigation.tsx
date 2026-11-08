'use client';

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutGrid,
  ShoppingCart,
  UserRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { TouchEvent } from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useMe } from '@/services/features/auth/hooks';
import type { CategoriesResponse } from '@/services/features/categories/types';
import { useCartStore } from '@/store/cart.store';

import { type CategoryNode, makeCategoryTree } from './category-navigation';

const categoryItemClass =
  'flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-right text-sm text-gray-800 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gray-800';

export default function MobileBottomNavigation({
  categories,
}: {
  categories: CategoriesResponse[];
}) {
  const pathname = usePathname();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categoryPath, setCategoryPath] = useState<CategoryNode[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef(new Map<number | 'root', number>());
  const headerTouchStart = useRef<number | null>(null);
  const { openCart } = useCartStore();
  const { data: user } = useMe();
  const categoryTree = useMemo(
    () => makeCategoryTree(categories),
    [categories],
  );
  const currentCategory = categoryPath.at(-1);
  const visibleCategories = currentCategory?.children ?? categoryTree;
  const profileHref = user?.data ? '/dashboard' : '/login';

  const setOpen = (open: boolean) => {
    setCategoriesOpen(open);
    if (!open) {
      setCategoryPath([]);
      scrollPositions.current.clear();
    }
  };

  const openCategory = (category: CategoryNode) => {
    scrollPositions.current.set(
      currentCategory?.id ?? 'root',
      scrollRef.current?.scrollTop ?? 0,
    );
    setCategoryPath(path => [...path, category]);
  };

  const finishHeaderSwipe = (event: TouchEvent<HTMLDivElement>) => {
    if (
      headerTouchStart.current !== null &&
      event.changedTouches[0].clientY - headerTouchStart.current > 80
    ) {
      setOpen(false);
    }
    headerTouchStart.current = null;
  };

  // Keep the previous level's position when returning from a subcategory.
  useLayoutEffect(() => {
    if (categoriesOpen && scrollRef.current) {
      scrollRef.current.scrollTop =
        scrollPositions.current.get(currentCategory?.id ?? 'root') ?? 0;
    }
  }, [categoriesOpen, currentCategory?.id]);

  // The sheet is mobile-only; don't leave its modal overlay/focus trap behind
  // if the viewport changes to desktop while it is open.
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setCategoriesOpen(false);
        setCategoryPath([]);
        scrollPositions.current.clear();
      }
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  const itemClass = (active: boolean) =>
    cn(
      'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1 text-[10px] transition-colors',
      active ? 'text-black' : 'text-gray-500 hover:text-black',
    );

  return (
    <>
      <nav
        dir="rtl"
        aria-label="ناوبری موبایل"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto flex h-16 max-w-xl items-stretch px-2">
          <Link
            href="/"
            className={itemClass(pathname === '/')}
            aria-label="خانه"
          >
            <Home className="size-5" strokeWidth={1.7} />
            <span>خانه</span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className={itemClass(
              categoriesOpen ||
                pathname.startsWith('/category') ||
                pathname.startsWith('/product-category'),
            )}
            aria-label="دسته‌بندی‌ها"
            aria-expanded={categoriesOpen}
          >
            <LayoutGrid className="size-5" strokeWidth={1.7} />
            <span>دسته‌بندی‌ها</span>
          </button>

          <button
            type="button"
            onClick={openCart}
            className={itemClass(false)}
            aria-label="سبد خرید"
          >
            <ShoppingCart className="size-5" strokeWidth={1.7} />
            <span>سبد خرید</span>
          </button>

          <Link
            href={profileHref}
            className={itemClass(
              pathname.startsWith('/dashboard') || pathname === '/login',
            )}
            aria-label="پروفایل"
          >
            <UserRound className="size-5" strokeWidth={1.7} />
            <span>پروفایل</span>
          </Link>
        </div>
      </nav>

      <Sheet open={categoriesOpen} onOpenChange={setOpen}>
        <SheetContent
          dir="rtl"
          side="bottom"
          showCloseButton={false}
          // The sheet's default bottom-side h-auto must be overridden at the
          // same specificity; a plain h-* class lets a long list fill the screen.
          className="min-h-0 max-h-[calc(100dvh-16px)] gap-0 rounded-t-2xl bg-white p-0 shadow-2xl data-[side=bottom]:h-[min(72dvh,600px)] lg:hidden"
        >
          <div
            className="shrink-0 border-b border-gray-100"
            onTouchStart={event => {
              headerTouchStart.current = event.touches[0].clientY;
            }}
            onTouchEnd={finishHeaderSwipe}
            onTouchCancel={() => {
              headerTouchStart.current = null;
            }}
          >
            <div
              className="mx-auto mt-2 h-1 w-10 rounded-full bg-gray-300"
              aria-hidden="true"
            />
            <SheetHeader className="mx-auto flex w-full max-w-xl flex-row items-center gap-2 px-3 py-2">
              {currentCategory ? (
                <button
                  type="button"
                  onClick={() => setCategoryPath(path => path.slice(0, -1))}
                  aria-label="بازگشت به دسته‌بندی قبلی"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-gray-800"
                >
                  <ChevronRight className="size-5" />
                </button>
              ) : (
                <span className="size-10 shrink-0" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1 text-center">
                <SheetTitle className="truncate font-semibold">
                  {currentCategory?.name ?? 'دسته‌بندی محصولات'}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  برای دیدن زیر‌دسته‌ها یک دسته‌بندی را انتخاب کنید.
                </SheetDescription>
              </div>
              <SheetClose asChild>
                <button
                  type="button"
                  aria-label="بستن دسته‌بندی‌ها"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-gray-800"
                >
                  <X className="size-5" />
                </button>
              </SheetClose>
            </SheetHeader>
          </div>

          <div
            key={currentCategory?.id ?? 'root'}
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(20px+env(safe-area-inset-bottom))] pt-3"
          >
            <div className="mx-auto w-full max-w-xl px-3">
              {currentCategory && (
                <div className="mb-3 space-y-2">
                  <Link
                    href={`/product-category/${currentCategory.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center justify-between gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-700"
                  >
                    <span>مشاهده همه محصولات {currentCategory.name}</span>
                    <ArrowLeft className="size-4 shrink-0" />
                  </Link>
                  <Link
                    href={`/category/${currentCategory.slug}`}
                    onClick={() => setOpen(false)}
                    className="inline-flex min-h-9 items-center gap-1 px-2 text-xs text-gray-600 underline-offset-4 hover:underline"
                  >
                    مرور صفحه دسته‌بندی
                    <ArrowLeft className="size-3.5" />
                  </Link>
                </div>
              )}

              {visibleCategories.length ? (
                <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {visibleCategories.map(category =>
                    category.children.length ? (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => openCategory(category)}
                        className={categoryItemClass}
                        aria-label={`نمایش زیر‌دسته‌های ${category.name}`}
                      >
                        <span className="min-w-0">
                          <span className="block font-medium">
                            {category.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-gray-500">
                            {category.children.length} زیر‌دسته
                          </span>
                        </span>
                        <ChevronLeft className="size-4 shrink-0 text-gray-400" />
                      </button>
                    ) : (
                      <Link
                        key={category.id}
                        href={`/product-category/${category.slug}`}
                        onClick={() => setOpen(false)}
                        className={categoryItemClass}
                      >
                        <span>{category.name}</span>
                        <ArrowLeft className="size-4 shrink-0 text-gray-400" />
                      </Link>
                    ),
                  )}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-gray-500">
                  دسته‌بندی‌ای برای نمایش وجود ندارد
                </p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
