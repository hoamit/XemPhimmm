import MovieCard from '@/components/movie/MovieCard';
import Pagination from '@/components/movie/Pagination';
import MovieFilter from '@/components/movie/MovieFilter';
import { debugWarn } from '@/lib/debug';
import { getTypeConfig, getTypePageData } from '@/lib/catalog';
import { Metadata } from 'next';

interface TypePageProps {
  params: Promise<{
    type: string;
  }>;
  searchParams: Promise<{
    page?: string;
    category?: string;
    country?: string;
    year?: string;
    lang?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({ params }: TypePageProps): Promise<Metadata> {
  const { type } = await params;
  const config = getTypeConfig(type);

  return {
    title: `${config.label} - XemPhimmm`,
    description: config.description,
  };
}

export default async function TypePage({ params, searchParams }: TypePageProps) {
  const { type } = await params;
  const sParams = await searchParams;
  const currentPage = Number(sParams.page) || 1;
  let pageData: Awaited<ReturnType<typeof getTypePageData>> | null = null;

  try {
    pageData = await getTypePageData(type, currentPage, sParams);
  } catch (error) {
    debugWarn('Type page fetch failed', error);
  }

  if (!pageData) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <h2 className="text-3xl font-semibold text-white">Không tải được danh mục</h2>
        <p className="mt-4 max-w-lg text-white/55">Nguồn phim đang phản hồi chậm. Hãy thử lại sau ít phút.</p>
      </div>
    );
  }

  const { config, movies, spotlight } = pageData;

  return (
    <div className="min-h-screen pb-20 pt-28">
      <div className="mx-auto max-w-[1700px] space-y-8 px-4 md:px-8 xl:px-12">
        <section className="relative overflow-hidden rounded-[2.2rem] border border-white/8 bg-white/[0.035] p-6 md:p-8">
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${config.accent}`} />

          <div className="relative grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/35">{config.tagline}</p>
              <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">{config.label}</h1>
              <p className="max-w-2xl text-base leading-7 text-white/58">{config.description}</p>

              <div className="flex flex-wrap gap-3 text-sm text-white/72">
                <span className="movie-chip bg-white/8 text-white/75">{movies.length}+ tựa</span>
                <span className="movie-chip bg-white/8 text-white/75">Nguồn tổng hợp</span>
                <span className="movie-chip bg-white/8 text-white/75">Ưu tiên title mới</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {spotlight.map((movie) => (
                <div key={movie.slug} className="rounded-[1.5rem] border border-white/8 bg-black/26 p-3 backdrop-blur-xl">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">{movie.year}</p>
                  <h2 className="mt-2 line-clamp-2 text-base font-semibold text-white">{movie.name}</h2>
                  <p className="mt-2 text-sm text-white/45">
                    {[movie.quality, movie.episode_current].filter(Boolean).join(' • ') || 'Đang cập nhật'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <MovieFilter currentType={type} />

        {movies.length ? (
          <section className="space-y-12">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {movies.map((movie, index) => (
                <MovieCard key={movie.slug} movie={movie} priority={index < 6} />
              ))}
            </div>

            {pageData.pagination?.totalPages && pageData.pagination.totalPages > 1 && (
              <Pagination 
                currentPage={currentPage}
                totalPages={pageData.pagination.totalPages}
                baseUrl={`/type/${type}`}
              />
            )}
          </section>
        ) : (
          <div className="rounded-[2rem] border border-white/8 bg-white/[0.035] px-6 py-16 text-center">
            <p className="text-lg text-white/55">Hiện chưa có phim nào trong danh mục này.</p>
          </div>
        )}
      </div>
    </div>
  );
}
