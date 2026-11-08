'use client';

import { ArrowLeft, Search as SearchIcon, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useDebounce } from '@/hooks/use-debounce';
import { formatPrice } from '@/lib/utils';
import { useSearchSuggestions } from '@/services/features/products/hooks';
import { ProductsResponse } from '@/services/features/products/type';

interface SearchProps {
  variant: 'desktop' | 'mobile';
}

const imageUrl = (image?: string) =>
  image ? `${process.env.NEXT_PUBLIC_IMAGE_URL || ''}${image}` : '';

function ProductSuggestion({
  product,
  onSelect,
}: {
  product: ProductsResponse;
  onSelect: () => void;
}) {
  const price =
    product.variants?.[0]?.discountedPrice ?? product.variants?.[0]?.price;

  return (
    <Link
      href={`/product/${product.slug}`}
      onClick={onSelect}
      className="flex min-w-0 items-center gap-3 border-b border-gray-100 px-3 py-3 text-right transition-colors last:border-0 hover:bg-gray-50"
    >
      <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-sm bg-gray-100">
        {imageUrl(product.image) && (
          <Image
            src={imageUrl(product.image)}
            alt={product.title}
            fill
            sizes="48px"
            className="object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm text-gray-800">{product.title}</p>
        {price != null && (
          <p className="mt-1 text-xs text-gray-500">
            {formatPrice(price)} تومان
          </p>
        )}
      </div>
      <ArrowLeft className="size-4 shrink-0 text-gray-400" />
    </Link>
  );
}

export default function Search({ variant }: SearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [openedPath, setOpenedPath] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 250).trim();
  const panelOpen = isOpen && openedPath === pathname;

  const { data, isFetching } = useSearchSuggestions(debouncedQuery, panelOpen);
  const suggestions = data?.data;
  const categories = suggestions?.categories ?? [];
  const products = useMemo(() => {
    const related = suggestions?.related ?? [];
    return related.length ? related : (suggestions?.popular ?? []);
  }, [suggestions]);

  useEffect(() => {
    if (isOpen && variant === 'desktop') {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, variant]);

  useEffect(() => {
    if (!panelOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [panelOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const openSearch = () => {
    if (openedPath !== pathname) setQuery('');
    setOpenedPath(pathname);
    setIsOpen(true);
  };
  const closeSearch = () => {
    setIsOpen(false);
    setQuery('');
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = query.trim();
    if (term) {
      router.push(`/products?search=${encodeURIComponent(term)}`);
      closeSearch();
    }
  };

  const panel =
    panelOpen && typeof document !== 'undefined' ? (
      <div
        className="fixed inset-x-0 bottom-0 top-[52px] z-[100] bg-black/30"
        onClick={event => {
          if (event.target === event.currentTarget) closeSearch();
        }}
      >
        <section
          dir="rtl"
          aria-label="جستجوی محصولات و دسته‌بندی‌ها"
          className="absolute inset-x-0 top-0 bottom-[calc(68px+env(safe-area-inset-bottom))] overflow-y-auto border-t border-gray-100 bg-white shadow-xl md:bottom-auto md:max-h-[min(74vh,720px)] md:border-t-0"
        >
          {variant === 'desktop' && (
            <form
              onSubmit={submitSearch}
              className="mx-auto flex max-w-5xl items-center gap-3 border-b border-gray-100 px-5 py-4"
            >
              <SearchIcon className="size-5 shrink-0 text-gray-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="جستجوی محصول یا دسته‌بندی..."
                className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
                  aria-label="پاک کردن جستجو"
                >
                  <X className="size-4" />
                </button>
              )}
              <button
                type="button"
                onClick={closeSearch}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="بستن جستجو"
              >
                <X className="size-5" />
              </button>
            </form>
          )}

          <div className="mx-auto max-w-5xl px-4 py-4 sm:px-5">
            {!debouncedQuery ? (
              <p className="py-8 text-center text-sm text-gray-400">
                برای دیدن محصولات و دسته‌بندی‌های مرتبط جستجو کنید
              </p>
            ) : debouncedQuery.length < 2 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                حداقل دو حرف وارد کنید
              </p>
            ) : isFetching && !suggestions ? (
              <p className="py-8 text-center text-sm text-gray-400">
                در حال جستجو...
              </p>
            ) : (
              <>
                {categories.length > 0 && (
                  <section className="mb-5">
                    <h2 className="mb-2 text-xs font-semibold text-gray-500">
                      دسته‌بندی‌های مرتبط
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => (
                        <Link
                          key={category.id}
                          href={`/product-category/${category.slug}`}
                          onClick={closeSearch}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-gray-500 hover:bg-white"
                        >
                          {category.name}
                          <ArrowLeft className="size-3.5 text-gray-400" />
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {products.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="text-xs font-semibold text-gray-500">
                        {suggestions?.related?.length
                          ? 'محصولات مرتبط'
                          : 'محصولات پیشنهادی'}
                      </h2>
                      <Link
                        href={`/products?search=${encodeURIComponent(query.trim())}`}
                        onClick={closeSearch}
                        className="text-xs text-gray-500 underline underline-offset-4 hover:text-black"
                      >
                        مشاهده همه نتایج
                      </Link>
                    </div>
                    <div className="overflow-hidden rounded-md border border-gray-100">
                      {products.slice(0, 6).map(product => (
                        <ProductSuggestion
                          key={product.id}
                          product={product}
                          onSelect={closeSearch}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {!categories.length && !products.length && !isFetching && (
                  <p className="py-8 text-center text-sm text-gray-500">
                    نتیجه‌ای برای «{query.trim()}» پیدا نشد
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    ) : null;

  const mobileControl = (
    <form
      onSubmit={submitSearch}
      className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 focus-within:border-gray-400 focus-within:bg-white"
      role="search"
    >
      <SearchIcon className="size-4 shrink-0 text-gray-400" />
      <input
        value={query}
        onFocus={openSearch}
        onChange={event => {
          setQuery(event.target.value);
          openSearch();
        }}
        placeholder="جستجوی محصول و دسته‌بندی"
        className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-xs placeholder:text-gray-400"
        aria-label="جستجوی محصول و دسته‌بندی"
        autoComplete="off"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery('')}
          className="shrink-0 text-gray-400"
          aria-label="پاک کردن جستجو"
        >
          <X className="size-4" />
        </button>
      )}
    </form>
  );

  return (
    <>
      {variant === 'desktop' ? (
        <button
          type="button"
          onClick={openSearch}
          className="inline-flex size-9 items-center justify-center rounded-md text-gray-800 transition-colors hover:bg-gray-100"
          aria-label="جستجو"
          aria-expanded={isOpen}
        >
          <SearchIcon className="size-4 md:size-5" />
        </button>
      ) : (
        mobileControl
      )}
      {panel && createPortal(panel, document.body)}
    </>
  );
}
