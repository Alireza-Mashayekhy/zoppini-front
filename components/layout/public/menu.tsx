'use client';

import { ChevronDown, ChevronLeft, MenuIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import Logo from '@/components/shared/logo';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { CategoriesResponse } from '@/services/features/categories/types';

type CategoryNode = CategoriesResponse & {
  children: CategoryNode[];
};

function buildCategoryTree(
  categories: CategoriesResponse[],
  parentId: number | null = null,
): CategoryNode[] {
  return categories
    .filter(cat => {
      const effectiveParentId = cat.parentId === cat.id ? null : cat.parentId;

      const catParentId =
        effectiveParentId !== null && effectiveParentId !== undefined
          ? Number(effectiveParentId)
          : null;

      if (parentId === null) {
        return catParentId === null;
      }

      return catParentId === parentId;
    })
    .map(cat => ({
      ...cat,
      children: buildCategoryTree(categories, cat.id),
    }));
}

export default function Menu({
  categories,
}: {
  categories: CategoriesResponse[];
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [isProductsOpen, setIsProductsOpen] = useState(false);

  const [activeCategory, setActiveCategory] = useState<CategoryNode | null>(
    null,
  );

  const tree = buildCategoryTree(categories);

  /*
   * ============================================
   * MOBILE
   * ============================================
   */

  const MobileCategoryNode = ({ category }: { category: CategoryNode }) => {
    const hasChildren = category.children.length > 0;

    if (!hasChildren) {
      return (
        <Link
          href={`/product-category/${category.slug}`}
          className="block rounded-none border no-underline! border-transparent px-4 py-2 text-sm hover:border-black"
          onClick={() => setIsMobileOpen(false)}
        >
          {category.name}
        </Link>
      );
    }

    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={String(category.id)} className="border-none">
          <AccordionTrigger className="h-[38px]! rounded-none border border-transparent px-4 py-2 text-sm hover:border-black hover:no-underline">
            {category.name}
          </AccordionTrigger>

          <AccordionContent>
            <div className="mr-4 mt-1 space-y-1 border-r pr-4">
              <Link
                href={`/product-category/${category.slug}`}
                className="block rounded-none border border-transparent no-underline! px-4 py-2 text-sm hover:border-black"
                onClick={() => setIsMobileOpen(false)}
              >
                مشاهده همه
              </Link>

              {category.children.map(child => (
                <MobileCategoryNode key={child.id} category={child} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  /*
   * ============================================
   * RENDER
   * ============================================
   */

  return (
    <>
      {/* ========================================
          DESKTOP
      ======================================== */}

      <div
        className="hidden lg:block"
        onMouseEnter={() => setIsProductsOpen(true)}
        onMouseLeave={() => {
          setIsProductsOpen(false);
          setActiveCategory(null);
        }}
      >
        <button
          type="button"
          className="flex items-center gap-1 px-3 py-2 text-sm transition-colors hover:text-black/60"
        >
          محصولات
          <ChevronDown className="size-4" />
        </button>

        {/* Mega Menu */}
        <div
          className={`absolute right-0 top-full z-50 w-screen pt-3 transition-all duration-200 ${
            isProductsOpen
              ? 'visible -translate-y-3 opacity-100'
              : 'invisible -translate-y-2 opacity-0'
          }`}
        >
          <div className="overflow-hidden rounded-sm border border-border bg-white shadow-xl">
            <div className="flex min-h-[320px]">
              {/* دسته‌های اصلی */}
              <div className="w-[240px] shrink-0 border-l bg-[#fafafa] p-4">
                <div className="mb-3 px-3 text-xs text-gray-400">
                  دسته‌بندی محصولات
                </div>

                <div className="space-y-1">
                  {tree.map(category => {
                    const hasChildren = category.children.length > 0;

                    return (
                      <Link
                        key={category.id}
                        href={`/product-category/${category.slug}`}
                        onMouseEnter={() =>
                          setActiveCategory(hasChildren ? category : null)
                        }
                        className={`group flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors ${
                          activeCategory?.id === category.id
                            ? 'bg-white text-black shadow-sm'
                            : 'text-gray-700 hover:bg-white'
                        }`}
                      >
                        <span>{category.name}</span>

                        {hasChildren && (
                          <ChevronLeft
                            className={`size-4 transition-transform ${
                              activeCategory?.id === category.id
                                ? 'translate-x-[-2px]'
                                : ''
                            }`}
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* زیرمجموعه‌ها */}
              <div className="min-w-0 flex-1 p-6">
                {activeCategory ? (
                  <>
                    <div className="mb-5 flex items-center justify-between border-b pb-4">
                      <span className="text-base font-medium">
                        {activeCategory.name}
                      </span>

                      <Link
                        href={`/product-category/${activeCategory.slug}`}
                        className="text-xs text-gray-500 transition-colors hover:text-black"
                      >
                        مشاهده همه
                      </Link>
                    </div>

                    {activeCategory.children.length > 0 ? (
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        {activeCategory.children.map(child => (
                          <Link
                            key={child.id}
                            href={`/product-category/${child.slug}`}
                            className="group flex items-center justify-between border-b border-transparent py-2 text-sm text-gray-600 transition-colors hover:border-gray-200 hover:text-black"
                          >
                            <span>{child.name}</span>

                            {child.children.length > 0 && (
                              <ChevronLeft className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                            )}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">
                        زیرمجموعه‌ای وجود ندارد.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <p className="text-sm text-gray-400">
                        یک دسته‌بندی را انتخاب کنید
                      </p>

                      <p className="mt-1 text-xs text-gray-300">
                        برای مشاهده زیرمجموعه‌ها روی دسته‌بندی نگه دارید
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* تصاویر تبلیغاتی */}
              <div className="flex w-[210px] shrink-0 flex-col gap-3 border-r p-3">
                <Link
                  href="#"
                  className="group relative aspect-square overflow-hidden"
                >
                  <Image
                    src="/home/category_1.jpg"
                    alt="محصولات زنانه"
                    fill
                    sizes="180px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
                </Link>

                <Link
                  href="#"
                  className="group relative aspect-square overflow-hidden"
                >
                  <Image
                    src="/home/category_2.jpg"
                    alt="محصولات مردانه"
                    fill
                    sizes="180px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================
          MOBILE
      ======================================== */}

      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(true)}
        >
          <MenuIcon className="size-4" />
        </Button>

        {/* Overlay */}
        <div
          onClick={() => setIsMobileOpen(false)}
          className={`fixed inset-0 z-40 h-screen w-screen bg-black/40 ${
            isMobileOpen ? '' : 'hidden'
          }`}
        />

        {/* Drawer */}
        <div
          className={`fixed right-0 top-0 bottom-0 z-50 h-screen min-w-[300px] border-l border-border bg-white shadow transition-transform ${
            isMobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex justify-center border-b border-border py-2">
            <Logo />
          </div>

          <div className="h-[calc(100%-80px)] space-y-1 overflow-y-auto p-4 scrollbar-thin">
            {tree.length === 0 ? (
              <p className="text-center text-gray-500">دسته‌بندی وجود ندارد</p>
            ) : (
              tree.map(category => (
                <MobileCategoryNode key={category.id} category={category} />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
