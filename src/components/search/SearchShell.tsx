'use client';

import React, { useDeferredValue, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, Sparkles, X } from 'lucide-react';

interface SearchShellProps {
  initialQuery: string;
  resultCount: number;
}

const QUICK_TAGS = ['phim hành động', 'anime', 'tv shows', 'tình cảm', 'hài'];

const SearchShell: React.FC<SearchShellProps> = ({ initialQuery, resultCount }) => {
  const router = useRouter();
  const [keyword, setKeyword] = useState(initialQuery);
  const deferredKeyword = useDeferredValue(keyword);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setKeyword(initialQuery);
  }, [initialQuery]);

  const navigateToSearch = (value: string) => {
    const trimmed = value.trim();

    startTransition(() => {
      router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
    });
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateToSearch(deferredKeyword);
  };

  return (
    <section className="relative overflow-hidden rounded-[2.2rem] border border-white/8 bg-white/[0.035] p-6 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,161,79,0.18),transparent_24%),radial-gradient(circle_at_right,rgba(79,142,255,0.1),transparent_18%)]" />

      <div className="relative space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/58">
            <Sparkles className="size-3.5 text-amber-300" />
            Search rebuilt
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Tìm phim nhanh hơn, ổn định hơn</h1>
          <p className="max-w-2xl text-base leading-7 text-white/58">
            Trang tìm kiếm đã chuyển sang render phía server để giảm lỗi phát sinh từ trình duyệt và giúp kết quả ổn định hơn.
          </p>
        </div>

        <form onSubmit={onSubmit} className="relative max-w-3xl">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-white/35" />
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm phim, diễn viên, đạo diễn..."
            className="w-full rounded-full border border-white/10 bg-black/35 py-4 pl-14 pr-28 text-base text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:border-white/20 focus:bg-black/55"
          />
          {keyword ? (
            <button
              type="button"
              onClick={() => setKeyword('')}
              className="absolute right-20 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white"
              aria-label="Xóa từ khóa"
            >
              <X className="size-5" />
            </button>
          ) : null}
          <button type="submit" className="btn-primary absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Tìm'}
          </button>
        </form>

        <div className="flex flex-wrap gap-3">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => navigateToSearch(tag)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/72 transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              {tag}
            </button>
          ))}
        </div>

        <p className="text-sm text-white/45">
          {initialQuery
            ? `Từ khóa "${initialQuery}" hiện có ${resultCount} kết quả.`
            : 'Nhập từ khóa hoặc chọn tag gợi ý để bắt đầu.'}
        </p>
      </div>
    </section>
  );
};

export default SearchShell;
