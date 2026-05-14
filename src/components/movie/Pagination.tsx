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
    const url = new URL(baseUrl, 'http://localhost');
    url.searchParams.set(queryParam, page.toString());
    return `${url.pathname}${url.search}`;
  };

  const renderPageNumbers = () => {
    const pages: Array<number | 'ellipsis'> = [];

    if (totalPages <= 5) {
      for (let page = 1; page <= totalPages; page += 1) {
        pages.push(page);
      }
    } else if (currentPage <= 2) {
      pages.push(1, 2, 'ellipsis', totalPages);
    } else if (currentPage >= totalPages - 1) {
      pages.push(1, 'ellipsis', totalPages - 1, totalPages);
    } else {
      pages.push(1, 'ellipsis', currentPage, 'ellipsis', totalPages);
    }

    return pages.map((item, index) => {
      if (item === 'ellipsis') {
        return (
          <span
            key={`ellipsis-${index}`}
            className="flex h-10 min-w-[40px] items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] px-3 text-sm font-bold text-white/65"
          >
            ...
          </span>
        );
      }

      return (
        <Link
          key={item}
          href={getPageUrl(item)}
          className={cn(
            'flex h-10 min-w-[40px] items-center justify-center rounded-xl border px-3 text-sm font-bold transition-all duration-300',
            currentPage === item
              ? 'border-primary bg-primary text-white shadow-[0_8px_20px_rgba(205,16,33,0.3)]'
              : 'border-white/8 bg-white/[0.03] text-white/50 hover:border-white/20 hover:bg-white/10 hover:text-white'
          )}
        >
          {item}
        </Link>
      );
    });
  };

  return (
    <div className="mb-8 mt-12 flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-white/50 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          aria-label="Trang truoc"
        >
          <ChevronLeft className="size-5" />
        </Link>
      )}

      <div className="flex items-center gap-2">{renderPageNumbers()}</div>

      {currentPage < totalPages && (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-white/50 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          aria-label="Trang tiep"
        >
          <ChevronRight className="size-5" />
        </Link>
      )}
    </div>
  );
};

export default Pagination;
