'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';

import { CatalogPageResponse } from '@/services/features/catalog/types';

import { CatalogPageView } from './catalog-page-view';

interface CatalogViewerProps {
  pages: CatalogPageResponse[];
}

const PAGE_RATIO = 600 / 850;

export default function CatalogViewer({ pages }: CatalogViewerProps) {
  const bookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [bookSize, setBookSize] = useState({
    width: 600,
    height: 850,
  });

  const totalPages = pages.length;

  const handleFlip = (event: { data: number }) => {
    setCurrentPage(event.data);
  };

  const nextPage = () => {
    bookRef.current?.pageFlip()?.flipNext();
  };

  const previousPage = () => {
    bookRef.current?.pageFlip()?.flipPrev();
  };

  /**
   * محاسبه اندازه کتاب بر اساس فضای واقعی موجود
   */
  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();

      const availableWidth = rect.width;
      const availableHeight = rect.height;

      if (!availableWidth || !availableHeight) return;

      /**
       * چون کتاب دو صفحه کنار هم دارد،
       * عرض کل کتاب تقریباً 2 برابر عرض یک صفحه است.
       */
      const maxBookWidth = availableWidth;
      const maxBookHeight = availableHeight;

      /**
       * نسبت یک صفحه:
       * 600 / 850
       *
       * نسبت کل کتاب:
       * 1200 / 850
       */
      const bookRatio = PAGE_RATIO * 2;

      let width = maxBookWidth;
      let height = width / bookRatio;

      /**
       * اگر ارتفاع بیشتر از فضای موجود شد،
       * بر اساس ارتفاع محاسبه می‌کنیم.
       */
      if (height > maxBookHeight) {
        height = maxBookHeight;
        width = height * bookRatio;
      }

      /**
       * حداقل اندازه برای اینکه کتاب بیش از حد کوچک نشود
       */
      const minHeight = 400;
      const minWidth = 280;

      width = Math.max(width, minWidth * 2);
      height = Math.max(height, minHeight);

      setBookSize({
        width: Math.floor(width),
        height: Math.floor(height),
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const catalogPages =
    pages.length % 2 === 0
      ? pages
      : [
          ...pages,
          {
            id: 'empty-page',
            image: '',
            pageNumber: pages.length,
          },
        ];

  const rtlPages = [...catalogPages].reverse();

  useEffect(() => {
    setTimeout(() => {
      bookRef.current?.pageFlip()?.turnToPage(rtlPages.length - 1);
    }, 100);
  }, []);

  if (!pages.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eeeae4]">
        <p className="text-sm text-black/40">کاتالوگی برای نمایش وجود ندارد.</p>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#eeeae4]">
      {/* فضای واقعی قابل استفاده */}
      <div
        ref={containerRef}
        className="
          absolute
          inset-x-0
          top-[52px]
          bottom-[64px]
          flex
          items-center
          justify-center
          overflow-hidden
          px-4
        "
      >
        {/*
          خیلی مهم:
          dir=ltr
          و flex روی این wrapper است،
          نه مستقیماً روی HTMLFlipBook
        */}
        <div dir="ltr" className="relative h-full w-full">
          <HTMLFlipBook
            ref={bookRef}
            width={bookSize.width / 2}
            height={bookSize.height}
            size="fixed"
            minWidth={280}
            maxWidth={1400}
            minHeight={400}
            maxHeight={1600}
            flippingTime={1100}
            drawShadow
            maxShadowOpacity={0.65}
            showCover={false}
            startPage={0}
            startZIndex={10}
            autoSize={false}
            mobileScrollSupport
            useMouseEvents
            clickEventForward
            showPageCorners
            swipeDistance={10}
            disableFlipByClick={false}
            onFlip={handleFlip}
            className="catalog-book"
            style={{}}
            usePortrait={false}
          >
            {rtlPages.map((page, index) => (
              <CatalogPageView
                key={page.id}
                page={page}
                pageNumber={catalogPages.length - index}
              />
            ))}
          </HTMLFlipBook>
        </div>
      </div>

      {/* Controls */}
      <div
        dir="ltr"
        className="
          absolute
          bottom-3
          left-1/2
          z-50
          flex
          -translate-x-1/2
          items-center
          gap-2
          rounded-full
          border
          border-black/10
          bg-white/90
          p-1.5
          shadow-lg
          backdrop-blur-md
        "
      >
        <button
          type="button"
          onClick={previousPage}
          disabled={currentPage <= 0}
          aria-label="صفحه قبل"
          className="
            flex
            size-10
            items-center
            justify-center
            rounded-full
            text-black/60
            transition
            hover:bg-black
            hover:text-white
            disabled:pointer-events-none
            disabled:opacity-25
          "
        >
          <ChevronLeft />
        </button>

        <span
          className="
            min-w-16
            px-1
            text-center
            text-xs
            tabular-nums
            text-black/50
          "
        >
          {totalPages} / {totalPages - currentPage - 1}
        </span>

        <button
          type="button"
          onClick={nextPage}
          disabled={currentPage >= totalPages - 1}
          aria-label="صفحه بعد"
          className="
            flex
            size-10
            items-center
            justify-center
            rounded-full
            text-black/60
            transition
            hover:bg-black
            hover:text-white
            disabled:pointer-events-none
            disabled:opacity-25
          "
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
