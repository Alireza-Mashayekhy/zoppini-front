'use client';
import { SearchIcon, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import ProductCard from '@/components/shared/product-card';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce'; // فرض می‌کنیم هوک دیبانس را در مسیر hooks دارید
import { useProducsList } from '@/services/features/products/hooks';

export default function Search() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [query, setQuery] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout>(null);

  const debouncedQuery = useDebounce(query, 300); // 300ms تأخیر

  const { data, isLoading } = useProducsList({
    search: debouncedQuery,
    all: false,
    page: 1,
    limit: 20,
  });

  const handleSearchClick = () => {
    setIsSearchOpen(true);
    setIsClosing(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCloseSearch = () => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimeoutRef.current = setTimeout(() => {
      setIsSearchOpen(false);
      setIsClosing(false);
      setQuery('');
    }, 600);
  };

  // Cleanup timeout on unmount or successful close
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Remove panel after exit animation ends
  useEffect(() => {
    if (isClosing && panelRef.current) {
      const panel = panelRef.current;
      const handleAnimationEnd = (e: AnimationEvent) => {
        if (e.animationName === 'flyUp') {
          if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
          setIsSearchOpen(false);
          setIsClosing(false);
          setQuery('');
        }
      };
      panel.addEventListener('animationend', handleAnimationEnd);
      return () =>
        panel.removeEventListener('animationend', handleAnimationEnd);
    }
  }, [isClosing]);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={handleSearchClick}>
        <SearchIcon className="size-5" />
      </Button>

      <style>{`
        @keyframes ballDrop {
          0% { transform: translateY(-100%); }
          35% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
          65% { transform: translateY(0); }
          75% { transform: translateY(-12px); }
          85% { transform: translateY(0); }
          100% { transform: translateY(0); }
        }
        @keyframes flyUp {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-100%); opacity: 0; }
        }
      `}</style>

      {isSearchOpen && (
        <div
          ref={panelRef}
          className="fixed z-50 bg-white flex flex-col items-center px-4"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            minHeight: '100vh',
            paddingTop: '5rem',
            animation: isClosing
              ? 'flyUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards'
              : 'ballDrop 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            willChange: 'transform',
          }}
        >
          <button
            onClick={handleCloseSearch}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition z-10"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>

          <div className="flex flex-col items-center w-full">
            <div className="relative w-full max-w-2xl">
              <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                placeholder="جستجوی محصولات ..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full h-12 pr-10 pl-3  border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                autoFocus={!isClosing}
              />
            </div>

            {/* نتایج جستجو */}
            <div className="mt-6 max-h-[70vh] overflow-y-auto w-full">
              {isLoading ? (
                <div className="text-center text-gray-400">در حال جستجو...</div>
              ) : data?.data && data?.data.length > 0 ? (
                <div className="grid gap-1 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  {data?.data.map(product => (
                    <ProductCard
                      key={product.id}
                      image={product.image}
                      price={product.variants[0].price}
                      slug={product.slug}
                      title={product.title}
                    />
                  ))}
                </div>
              ) : query.trim() && !isLoading ? (
                <div className="text-center text-gray-400">
                  نتیجه‌ای یافت نشد
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
