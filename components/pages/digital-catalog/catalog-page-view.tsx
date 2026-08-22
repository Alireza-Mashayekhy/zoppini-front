'use client';

import { forwardRef } from 'react';

import { CatalogPageResponse } from '@/services/features/catalog/types';

interface CatalogPageViewProps {
  page: CatalogPageResponse;
  pageNumber: number;
}

export const CatalogPageView = forwardRef<HTMLDivElement, CatalogPageViewProps>(
  ({ page, pageNumber }, ref) => {
    return (
      <div
        ref={ref}
        className="
        catalog-page
        relative
        h-full
        w-full
        overflow-hidden
        bg-white
        select-none
      "
      >
        <img
          src={page.image}
          alt=""
          draggable={false}
          className="
          pointer-events-none
          block
          h-full
          w-full
          object-cover
        "
        />

        <span
          className="
          pointer-events-none
          absolute
          bottom-3
          left-4
          text-xs
          text-black/30
        "
        >
          {pageNumber}
        </span>
      </div>
    );
  },
);

CatalogPageView.displayName = 'CatalogPageView';
