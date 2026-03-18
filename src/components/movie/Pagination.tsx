'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  queryParam?: string;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, baseUrl, queryParam = 'page' }) => {
  if (totalPages <= 1) return null;

  const getPageUrl = (page: number) => {
    const url = new URL(baseUrl, 'http://localhost'); // Dummy base for URL constructor
    url.searchParams.set(queryParam, page.toString());
    return `${url.pathname}${url.search}`;
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <Link
          key={i}
          href={getPageUrl(i)}
          className={cn(
            'flex h-10 min-w-[40px] items-center justify-center rounded-xl border px-3 text-sm font-bold transition-all duration-300',
            currentPage === i
              ? 'border-primary bg-primary text-white shadow-[0_8px_20px_rgba(205,16,33,0.3)]'
              : 'border-white/8 bg-white/[0.03] text-white/50 hover:border-white/20 hover:bg-white/10 hover:text-white'
          )}
        >
          {i}
        </Link>
      );
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-12 mb-8">
      {currentPage > 1 && (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-white/50 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          aria-label="Trang trước"
        >
          <ChevronLeft className="size-5" />
        </Link>
      )}

      <div className="flex items-center gap-2">{renderPageNumbers()}</div>

      {currentPage < totalPages && (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-white/50 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          aria-label="Trang tiếp"
        >
          <ChevronRight className="size-5" />
        </Link>
      )}
    </div>
  );
};

export default Pagination;
