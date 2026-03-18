import { Metadata } from 'next';
import PlayerExperience from '@/components/player/PlayerExperience';
import { apiClient } from '@/lib/api/client';
import { debugWarn } from '@/lib/debug';
import { stripHtml } from '@/lib/utils';

interface PlayerPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    ep?: string;
  }>;
}

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await apiClient.getMovieDetail(slug);
    return {
      title: `Xem ${res.movie.name} - XemPhimmm`,
      description: stripHtml(res.movie.content).slice(0, 160),
    };
  } catch {
    return { title: 'Player - XemPhimmm' };
  }
}

export default async function PlayerPage({ params, searchParams }: PlayerPageProps) {
  const { slug } = await params;
  const { ep } = await searchParams;
  let playerData: Awaited<ReturnType<typeof apiClient.getMovieDetail>> | null = null;

  try {
    playerData = await apiClient.getMovieDetail(slug);
  } catch (error) {
    debugWarn('Player page fetch failed', error);
  }

  if (!playerData) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <h2 className="text-3xl font-semibold text-white">Không tải được player</h2>
        <p className="mt-4 max-w-lg text-white/55">Nguồn phim đang phản hồi chậm hoặc nội dung này tạm thời không khả dụng.</p>
      </div>
    );
  }

  if (!playerData.episodes.length || !playerData.episodes.some((server) => server.server_data.length)) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <h2 className="text-3xl font-semibold text-white">Phim chưa có nguồn phát</h2>
        <p className="mt-4 max-w-lg text-white/55">Hãy quay lại sau, khi nguồn phát được cập nhật đầy đủ hơn.</p>
      </div>
    );
  }

  return <PlayerExperience movie={playerData.movie} servers={playerData.episodes} initialEpisodeSlug={ep} />;
}
