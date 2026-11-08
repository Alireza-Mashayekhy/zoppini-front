'use client';

import { Home, LayoutGrid, ShoppingCart, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useMe } from '@/services/features/auth/hooks';
import { CategoriesResponse } from '@/services/features/categories/types';
import { useCartStore } from '@/store/cart.store';

interface CategoryNode extends CategoriesResponse {
  children: CategoryNode[];
}

function makeCategoryTree(categories: CategoriesResponse[]): CategoryNode[] {
  const byParent = new Map<number | null, CategoriesResponse[]>();
  for (const category of categories) {
    const parentId =
      category.parentId === category.id ? null : (category.parentId ?? null);
    byParent.set(parentId, [...(byParent.get(parentId) ?? []), category]);
  }

  const build = (
    parentId: number | null,
    ancestors: Set<number>,
  ): CategoryNode[] =>
    (byParent.get(parentId) ?? [])
      .filter(category => !ancestors.has(category.id))
      .map(category => {
        const nextAncestors = new Set(ancestors).add(category.id);
        return {
          ...category,
          children: build(category.id, nextAncestors),
        };
      });

  return build(null, new Set());
}

function CategoryLinks({
  categories,
  level = 0,
  onSelect,
}: {
  categories: CategoryNode[];
  level?: number;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        'space-y-1',
        level > 0 && 'mr-4 border-r border-gray-100 pr-3',
      )}
    >
      {categories.map(category => (
        <div key={category.id}>
          <Link
            href={
              category.children.length
                ? `/category/${category.slug}`
                : `/product-category/${category.slug}`
            }
            onClick={onSelect}
            className="flex min-h-11 items-center justify-between rounded-md px-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-black"
          >
            <span>{category.name}</span>
            {category.children.length > 0 && (
              <span className="text-xs text-gray-400">
                {category.children.length} دسته
              </span>
            )}
          </Link>
          {category.children.length > 0 && (
            <CategoryLinks
              categories={category.children}
              level={level + 1}
              onSelect={onSelect}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function MobileBottomNavigation({
  categories,
}: {
  categories: CategoriesResponse[];
}) {
  const pathname = usePathname();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const { openCart } = useCartStore();
  const { data: user } = useMe();
  const categoryTree = useMemo(
    () => makeCategoryTree(categories),
    [categories],
  );
  const profileHref = user?.data ? '/dashboard' : '/login';

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
            onClick={() => setCategoriesOpen(true)}
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

      <Sheet open={categoriesOpen} onOpenChange={setCategoriesOpen}>
        <SheetContent
          side="bottom"
          showCloseButton
          className="h-[min(78dvh,680px)] rounded-t-xl p-0 lg:hidden"
        >
          <SheetHeader className="shrink-0 border-b border-gray-100 px-5 py-4">
            <SheetTitle>دسته‌بندی محصولات</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 pb-8">
            {categoryTree.length ? (
              <CategoryLinks
                categories={categoryTree}
                onSelect={() => setCategoriesOpen(false)}
              />
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">
                دسته‌بندی‌ای برای نمایش وجود ندارد
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
