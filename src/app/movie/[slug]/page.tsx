import { Metadata } from 'next';
import { apiClient } from '@/lib/api/client';
import { debugWarn } from '@/lib/debug';
import { getRelatedMovies } from '@/lib/catalog';
import { stripHtml } from '@/lib/utils';
import MovieDetailView from '@/components/movie/MovieDetailView';

interface MovieDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: MovieDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await apiClient.getMovieDetail(slug);
    return {
      title: `${res.movie.name} - PhimHay`,
      description: stripHtml(res.movie.content).slice(0, 160),
    };
  } catch {
    return { title: 'Movie Detail - PhimHay' };
  }
}

export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
  const { slug } = await params;
  let detailData:
    | {
        movie: Awaited<ReturnType<typeof apiClient.getMovieDetail>>['movie'];
        episodes: Awaited<ReturnType<typeof apiClient.getMovieDetail>>['episodes'];
        relatedMovies: Awaited<ReturnType<typeof getRelatedMovies>>;
      }
    | null = null;

  try {
    const res = await apiClient.getMovieDetail(slug);
    const related = await getRelatedMovies(res.movie.type, res.movie.slug);
    detailData = {
      movie: res.movie,
      episodes: res.episodes,
      relatedMovies: related,
    };
  } catch (error) {
    debugWarn('Movie detail page fetch failed', error);
  }

  if (!detailData) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 text-center">
        <div>
          <h2 className="text-3xl font-semibold text-white">Không tải được chi tiết phim</h2>
          <p className="mt-4 max-w-lg text-white/55">Nguồn phim đang phản hồi chậm hoặc nội dung này tạm thời không khả dụng.</p>
        </div>
      </div>
    );
  }

  return (
    <MovieDetailView 
      movie={detailData.movie}
      episodes={detailData.episodes}
      relatedMovies={detailData.relatedMovies}
    />
  );
}
