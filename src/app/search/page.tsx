import MovieCard from '@/components/movie/MovieCard';
import MovieCarousel from '@/components/movie/MovieCarousel';
import Pagination from '@/components/movie/Pagination';
import SearchShell from '@/components/search/SearchShell';
import { Search } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { debugWarn } from '@/lib/debug';
import { MovieListResponse } from '@/types/movie';
import { Metadata } from 'next';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;

  return {
    title: q ? `Tìm "${q}" - XemPhimmm` : 'Tìm kiếm phim - XemPhimmm',
    description: q ? `Kết quả tìm kiếm cho ${q} trên XemPhimmm.` : 'Tìm kiếm phim, diễn viên và nội dung yêu thích trên XemPhimmm.',
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, page } = await searchParams;
  const query = (q || '').trim();
  const currentPage = Number(page) || 1;
  
  let searchResults: MovieListResponse = { status: true, items: [] };
  let discovery: MovieListResponse | null = null;

  try {
    const emptySearchResults: MovieListResponse = { status: true, items: [], pagination: { totalPages: 0, currentPage: 1 } };
    [searchResults, discovery] = await Promise.all([
      query ? apiClient.searchMovies(query, 36, currentPage) : Promise.resolve(emptySearchResults),
      apiClient.getLatestMovies(1, 1),
    ]);
  } catch (error) {
    debugWarn('Search page failed', error);
  }

  if (!discovery) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <h2 className="text-3xl font-semibold text-white">Không tải được trang tìm kiếm</h2>
        <p className="mt-4 max-w-lg text-white/55">Nguồn phim đang phản hồi chậm. Hãy thử lại sau ít phút.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-28">
      <div className="mx-auto max-w-[1700px] space-y-8 px-4 md:px-8 xl:px-12">
        <SearchShell initialQuery={query} resultCount={searchResults.pagination?.totalItems || searchResults.items.length} />

        {query ? (
          searchResults.items.length ? (
            <section className="space-y-8">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/35">Kết quả tìm kiếm</p>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-3xl font-semibold text-white md:text-4xl">
                    &quot;{query}&quot;
                  </h2>
                  {searchResults.pagination?.totalPages && searchResults.pagination.totalPages > 1 && (
                    <p className="text-sm text-white/40 font-medium">
                      Trang {currentPage} / {searchResults.pagination.totalPages}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                {searchResults.items.map((movie, index) => (
                  <MovieCard key={movie.slug} movie={movie} priority={index < 6} />
                ))}
              </div>

              {searchResults.pagination?.totalPages && searchResults.pagination.totalPages > 1 && (
                <Pagination 
                  currentPage={currentPage}
                  totalPages={searchResults.pagination.totalPages}
                  baseUrl={`/search?q=${encodeURIComponent(query)}`}
                />
              )}
            </section>
          ) : (
            <div className="rounded-[2.5rem] border border-white/8 bg-white/[0.035] px-6 py-20 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <Search className="size-7 text-white/20" />
              </div>
              <h3 className="text-xl font-semibold text-white">Không tìm thấy kết quả</h3>
              <p className="mt-2 text-white/40">Chưa tìm thấy phim phù hợp với từ khóa &quot;{query}&quot;. Hãy thử lại với tên phim khác.</p>
            </div>
          )
        ) : null}

        <div className="pt-8">
          <MovieCarousel
            title={query ? 'Khám phá thêm' : 'Mới cập nhật để khám phá'}
            description={
              query
                ? 'Nếu chưa thấy phim hợp ý, thử xem nhanh các title mới vừa cập nhật.'
                : 'Một dải title mới để bạn bắt đầu khám phá ngay từ trang tìm kiếm.'
            }
            movies={discovery.items.slice(0, 18)}
            href="/"
            accent="from-amber-300/30 via-rose-300/10 to-transparent"
          />
        </div>
      </div>
    </div>
  );
}
