'use client';
import { MenuIcon } from 'lucide-react';
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
      // اگر parentId برابر با id خودش باشد، آن را به‌عنوان ریشه در نظر بگیر
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
  const [isOpen, setOpen] = useState(false);

  const tree = buildCategoryTree(categories);

  const CategoryNode = ({ category }: { category: CategoryNode }) => {
    const hasChildren = category.children.length > 0;

    // دسته‌بندی بدون فرزند: لینک ساده
    if (!hasChildren) {
      return (
        <Link
          href={`/products/${category.slug}`}
          className="block px-4 py-2 text-sm border border-transparent hover:border-black rounded-none decoration-transparent"
          onClick={() => setOpen(false)}
        >
          {category.name}
        </Link>
      );
    }

    // دسته‌بندی با فرزند: آکاردئون + لینک "مشاهده همه"
    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={String(category.id)}>
          <AccordionTrigger className="h-[38px]! py-2 text-sm border border-transparent hover:border-black rounded-none hover:no-underline px-4">
            {category.name}
          </AccordionTrigger>
          <AccordionContent>
            <div className="mr-4 mt-1 space-y-1 border-r pr-4">
              {/* لینک مشاهده همه */}
              <Link
                href={`/products/${category.slug}`}
                className="block px-4 py-2 text-sm border border-transparent hover:border-black rounded-none decoration-transparent"
                onClick={() => setOpen(false)}
              >
                مشاهده همه
              </Link>
              {/* فرزندان */}
              {category.children.map(child => (
                <CategoryNode key={child.id} category={child} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <MenuIcon className="size-5" />
      </Button>
      <div
        onClick={() => setOpen(false)}
        className={`fixed top-0 w-screen h-screen bg-black/40 ${isOpen ? '' : 'hidden'}`}
      />
      <div
        className={`fixed right-0 top-0 bottom-0 bg-white h-screen min-w-[300px] border-l border-border shadow transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-center border-b border-border py-2">
          <Logo />
        </div>
        <div className="p-4 overflow-y-auto scrollbar-thin h-[calc(100%-80px)] space-y-1">
          {/* <Link
            href="/blog"
            className="block px-4 py-2 text-sm border border-transparent hover:border-black rounded-none decoration-transparent"
            onClick={() => setOpen(false)}
          >
            مقالات
          </Link> */}
          {tree.length === 0 ? (
            <p className="text-center text-gray-500">دسته‌بندی وجود ندارد</p>
          ) : (
            tree.map(category => (
              <CategoryNode key={category.id} category={category} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
