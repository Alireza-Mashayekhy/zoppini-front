'use client';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface CustomPaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  siblingsCount?: number;
  /**
   * سازنده‌ی آدرسِ واقعی برای هر صفحه.
   *
   * اگر داده شود، دکمه‌های صفحه‌بندی به‌جای دکمه‌ی بدون آدرس، یک لینکِ واقعی
   * (`<a href>`) می‌شوند؛ بنابراین خزنده می‌تواند صفحات بعدی را کشف و دنبال
   * کند. کلیک همچنان با `onPageChange` به‌صورت سمت‌کلاینت انجام می‌شود
   * (بدون بارگذاری مجدد صفحه).
   *
   * برای بخش‌های مدیریت (که اصلاً نباید خزش شوند) این prop داده نمی‌شود.
   */
  hrefForPage?: (page: number) => string;
}

export default function CustomPagination({
  totalPages,
  currentPage,
  onPageChange,
  siblingsCount = 1,
  hrefForPage,
}: CustomPaginationProps) {
  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  const generatePages = () => {
    const items: (number | 'ellipsis')[] = [];

    items.push(1);

    if (currentPage > siblingsCount + 2) {
      items.push('ellipsis');
    }

    for (
      let i = Math.max(2, currentPage - siblingsCount);
      i <= Math.min(totalPages - 1, currentPage + siblingsCount);
      i++
    ) {
      items.push(i);
    }

    if (currentPage < totalPages - siblingsCount - 1) {
      items.push('ellipsis');
    }

    if (totalPages > 1) {
      items.push(totalPages);
    }

    return [...new Set(items)];
  };

  const pages = generatePages();

  const hrefFor = hrefForPage
    ? (page: number) => {
        try {
          return hrefForPage(page);
        } catch {
          return undefined;
        }
      }
    : undefined;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            text=""
            href={currentPage > 1 ? hrefFor?.(prevPage) : undefined}
            onClick={event => {
              if (currentPage <= 1) return;
              // لینک واقعی است؛ اما برای حفظ تجربه‌ی SPA، کلیک سمت کلاینت
              // مدیریت می‌شود و از بارگذاری کامل صفحه جلوگیری می‌کنیم.
              event.preventDefault();
              onPageChange(prevPage);
            }}
            className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>

        {pages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <PaginationItem key={`e-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={page}>
              <PaginationLink
                isActive={currentPage === page}
                href={hrefFor?.(page)}
                onClick={event => {
                  if (!hrefFor) {
                    onPageChange(page);
                    return;
                  }
                  event.preventDefault();
                  onPageChange(page);
                }}
                aria-label={`صفحه ${page}`}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          <PaginationNext
            text=""
            href={currentPage < totalPages ? hrefFor?.(nextPage) : undefined}
            onClick={event => {
              if (currentPage >= totalPages) return;
              event.preventDefault();
              onPageChange(nextPage);
            }}
            className={
              currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
