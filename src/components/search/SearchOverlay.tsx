'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { History, Loader2, Search, Sparkles, TrendingUp, X, XCircle } from 'lucide-react';
import MovieImage from '@/components/common/MovieImage';
import { Skeleton } from '@/components/common/Skeleton';
import { apiClient } from '@/lib/api/client';
import { debugWarn } from '@/lib/debug';
import { MovieListItem } from '@/types/movie';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

function readRecentSearches() {
  try {
    const saved = localStorage.getItem('recent_searches');

    if (!saved) {
      return [] as string[];
    }

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MovieListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setRecentSearches(readRecentSearches());
    const previousOverflow = document.body.style.overflow;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 100);

    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.searchMovies(query, 6);
        setResults(response.items);
      } catch (error) {
        setResults([]);
        debugWarn('Search overlay query failed', error);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [query]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }

    const updated = [query, ...recentSearches.filter((item) => item !== query)].slice(0, 5);
    localStorage.setItem('recent_searches', JSON.stringify(updated));

    onClose();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const removeRecent = (search: string) => {
    const updated = recentSearches.filter((item) => item !== search);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-3xl"
        >
          <div className="mx-auto w-full max-w-4xl px-4 pt-20 md:pt-32">
            <div className="relative">
              <form onSubmit={handleSearch} className="group relative">
                <Search className="absolute left-6 top-1/2 size-6 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-primary" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm phim, diễn viên, thể loại..."
                  className="w-full rounded-[2.5rem] border border-white/10 bg-white/5 py-6 pl-16 pr-20 text-xl font-medium text-white outline-none transition-all focus:border-primary/50 focus:bg-white/10 focus:ring-4 focus:ring-primary/10 md:text-2xl"
                />
                <div className="absolute right-6 top-1/2 flex -translate-y-1/2 items-center gap-3">
                  {isLoading ? <Loader2 className="size-6 animate-spin text-primary" /> : null}
                  <button
                    type="button"
                    onClick={onClose}
                    className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  >
                    <X className="size-6" />
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-12 grid gap-12 md:grid-cols-2">
              <div className="space-y-8">
                {query.trim() === '' ? (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-white/30">
                        <History className="size-4" />
                        Tìm kiếm gần đây
                      </div>
                      {recentSearches.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((search) => (
                            <div
                              key={search}
                              className="group flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-4 py-2 text-white/70 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-white"
                            >
                              <button type="button" onClick={() => setQuery(search)} className="text-sm font-medium">
                                {search}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeRecent(search)}
                                className="opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <XCircle className="size-3.5 hover:text-primary" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm italic text-white/20">Chưa có tìm kiếm nào gần đây</p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-white/30">
                        <TrendingUp className="size-4" />
                        Đề xuất
                      </div>
                      <div className="grid gap-3">
                        {['Phim hành động', 'Phim bộ hot', 'Anime hay', 'Phim chiếu rạp'].map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => setQuery(suggestion)}
                            className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left transition-all hover:translate-x-1 hover:bg-white/5"
                          >
                            <div className="grid size-8 place-items-center rounded-lg bg-white/5">
                              <Search className="size-4 text-white/40" />
                            </div>
                            <span className="text-sm font-medium text-white/80">{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-white/30">
                      <Sparkles className="size-4 text-amber-300" />
                      Kết quả nhanh
                    </div>

                    {isLoading ? (
                      <div className="grid gap-4">
                        {[...Array(4)].map((_, index) => (
                          <div
                            key={`search-skeleton-${index}`}
                            className="flex gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3"
                          >
                            <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-lg bg-white/5">
                              <Skeleton className="absolute inset-0 rounded-none" />
                            </div>
                            <div className="flex flex-1 flex-col justify-center gap-2 overflow-hidden">
                              <Skeleton className="h-4 w-3/4 rounded-full" />
                              <Skeleton className="h-3 w-1/3 rounded-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : results.length > 0 ? (
                      <div className="grid gap-4">
                        {results.map((movie) => (
                          <Link
                            key={movie.slug}
                            href={`/movie/${movie.slug}`}
                            onClick={onClose}
                            className="group flex gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:bg-white/5"
                          >
                            <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-lg bg-white/5">
                              <MovieImage
                                src={movie.poster}
                                alt={movie.title || movie.name}
                                fill
                                sizes="64px"
                                className="object-cover transition-transform group-hover:scale-110"
                              />
                            </div>
                            <div className="flex flex-col justify-center overflow-hidden">
                              <h4 className="truncate font-semibold text-white transition-colors group-hover:text-primary">
                                {movie.title || movie.name}
                              </h4>
                              <p className="mt-1 text-xs text-white/40">
                                {[movie.year || null, movie.quality || 'Đang cập nhật'].filter(Boolean).join(' • ')}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic text-white/20">Không tìm thấy kết quả nào</p>
                    )}
                  </div>
                )}
              </div>

              <div className="hidden space-y-8 md:block">
                <div className="rounded-[2.5rem] border border-white/5 bg-[linear-gradient(135deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_100%)] p-8">
                  <h3 className="text-xl font-bold text-white">XemPhimmm Search</h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/40">
                    Tìm kiếm thông minh hơn trên toàn bộ các nguồn phim KKPhim, OPhim và PhimAPI.
                    Nhấn <strong>Enter</strong> để xem đầy đủ kết quả tìm kiếm.
                  </p>
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-white">40k+</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Đầu phim</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-white">Lumi</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Tìm kiếm</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default SearchOverlay;
