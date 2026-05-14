'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, SkipBack, SkipForward } from 'lucide-react';
import { normalizeMovie } from '@/lib/movie';
import { Episode, MovieDetail } from '@/types/movie';
import { cn, stripHtml } from '@/lib/utils';
import { useMovieStorage } from '@/hooks/useMovieStorage';
import VideoPlayer from '@/components/player/VideoPlayer';

interface PlayerExperienceProps {
  movie: MovieDetail;
  servers: Episode[];
  initialEpisodeSlug?: string;
}

function findEpisodePosition(servers: Episode[], episodeSlug?: string) {
  if (!episodeSlug) {
    return {
      serverIndex: 0,
      episodeSlug: servers[0]?.server_data[0]?.slug || '',
    };
  }

  for (const [serverIndex, server] of servers.entries()) {
    const episode = server.server_data.find((item) => item.slug === episodeSlug);
    if (episode) {
      return {
        serverIndex,
        episodeSlug: episode.slug,
      };
    }
  }

  return {
    serverIndex: 0,
    episodeSlug: servers[0]?.server_data[0]?.slug || '',
  };
}

const PlayerExperience: React.FC<PlayerExperienceProps> = ({ movie, servers, initialEpisodeSlug }) => {
  const { addToHistory } = useMovieStorage();
  const initialPosition = useMemo(() => findEpisodePosition(servers, initialEpisodeSlug), [servers, initialEpisodeSlug]);
  const [currentServerIndex, setCurrentServerIndex] = useState(initialPosition.serverIndex);
  const [currentEpisodeSlug, setCurrentEpisodeSlug] = useState(initialPosition.episodeSlug);

  useEffect(() => {
    setCurrentServerIndex(initialPosition.serverIndex);
    setCurrentEpisodeSlug(initialPosition.episodeSlug);
  }, [initialPosition]);

  useEffect(() => {
    addToHistory(normalizeMovie(movie));
  }, [addToHistory, movie]);

  const currentServer = servers[currentServerIndex] || servers[0];
  const currentEpisode =
    currentServer?.server_data.find((episode) => episode.slug === currentEpisodeSlug) ||
    currentServer?.server_data[0] ||
    null;
  const currentEpisodeIndex = currentServer?.server_data.findIndex((item) => item.slug === currentEpisode?.slug) ?? -1;

  useEffect(() => {
    if (!currentEpisode?.slug) {
      return;
    }

    window.history.replaceState({}, '', `/player/${movie.slug}?ep=${currentEpisode.slug}`);
  }, [currentEpisode?.slug, movie.slug]);

  const selectServer = useCallback(
    (serverIndex: number) => {
      const targetServer = servers[serverIndex];
      if (!targetServer) {
        return;
      }

      setCurrentServerIndex(serverIndex);
      const matchingEpisode =
        targetServer.server_data.find((episode) => episode.slug === currentEpisodeSlug) ||
        targetServer.server_data[0];
      setCurrentEpisodeSlug(matchingEpisode?.slug || '');
    },
    [currentEpisodeSlug, servers]
  );

  const handleNextEpisode = useCallback(() => {
    if (!currentServer || !currentEpisode) {
      return;
    }

    const currentIndex = currentServer.server_data.findIndex((episode) => episode.slug === currentEpisode.slug);
    const nextEpisode = currentServer.server_data[currentIndex + 1];

    if (nextEpisode) {
      setCurrentEpisodeSlug(nextEpisode.slug);
    }
  }, [currentEpisode, currentServer]);

  const handlePreviousEpisode = useCallback(() => {
    if (!currentServer || !currentEpisode) {
      return;
    }

    const currentIndex = currentServer.server_data.findIndex((episode) => episode.slug === currentEpisode.slug);
    const previousEpisode = currentServer.server_data[currentIndex - 1];

    if (previousEpisode) {
      setCurrentEpisodeSlug(previousEpisode.slug);
    }
  }, [currentEpisode, currentServer]);

  const handleServerError = useCallback(() => {
    if (servers.length <= 1) {
      return;
    }

    selectServer((currentServerIndex + 1) % servers.length);
  }, [currentServerIndex, selectServer, servers.length]);

  if (!currentEpisode) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <h2 className="text-3xl font-semibold text-white">Không tìm thấy tập phim</h2>
        <p className="mt-4 max-w-lg text-white/55">Hãy quay lại trang chi tiết hoặc chọn nội dung khác.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#040404] pb-20 pt-24">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-[0.16] blur-[90px]"
          style={{ backgroundImage: `url(${movie.backdrop || movie.poster})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,4,4,0.74)_0%,rgba(4,4,4,0.92)_38%,rgba(4,4,4,1)_100%)]" />
      </div>

      <div className="relative mx-auto max-w-[1560px] px-4 md:px-8 xl:px-12">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/38">
          <Link href="/" className="transition-colors hover:text-white/70">
            Home
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href={`/movie/${movie.slug}`} className="max-w-[220px] truncate transition-colors hover:text-white/70">
            {movie.name}
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-white/75">{currentEpisode.name}</span>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/50 shadow-[0_30px_70px_rgba(0,0,0,0.42)]">
              <VideoPlayer
                url={currentEpisode.link_m3u8 || currentEpisode.link_embed}
                poster={movie.poster}
                onEnded={handleNextEpisode}
                onError={handleServerError}
              />
            </div>

            <div className="rounded-[2rem] border border-white/8 bg-white/[0.035] p-6 md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-3 text-sm text-white/72">
                    <span className="movie-chip bg-rose-500/15 text-rose-100">{movie.quality || 'HD'}</span>
                    <span className="movie-chip bg-white/8 text-white/75">{movie.year}</span>
                    {movie.lang ? <span className="movie-chip bg-white/8 text-white/75">{movie.lang}</span> : null}
                  </div>
                  <h1 className="mt-4 text-4xl font-semibold text-white md:text-5xl">{movie.name}</h1>
                  <p className="mt-3 text-lg text-white/45">{movie.origin_name}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handlePreviousEpisode}
                    className="btn-secondary"
                    disabled={currentEpisodeIndex <= 0}
                  >
                    <SkipBack className="size-4" />
                    Tập trước
                  </button>
                  <button
                    type="button"
                    onClick={handleNextEpisode}
                    className="btn-primary"
                    disabled={currentEpisodeIndex >= currentServer.server_data.length - 1}
                  >
                    Tập tiếp
                    <SkipForward className="size-4" />
                  </button>
                </div>
              </div>

              <p className="mt-6 max-w-4xl text-base leading-8 text-white/58">
                {stripHtml(movie.content) || 'Nội dung phim đang được cập nhật.'}
              </p>
            </div>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24">
            <div className="rounded-[2rem] border border-white/8 bg-white/[0.035] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/35">Danh sách tập</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{currentServer?.server_data.length || 0} tập</h2>
                </div>
                <span className="movie-chip bg-white/8 text-white/75">{currentServer?.server_name || 'Server 1'}</span>
              </div>

              <div className="mt-5 grid max-h-[48vh] grid-cols-4 gap-3 overflow-y-auto pr-1 sm:grid-cols-5 xl:grid-cols-4">
                {currentServer?.server_data.map((episode) => (
                  <button
                    key={episode.slug}
                    type="button"
                    onClick={() => setCurrentEpisodeSlug(episode.slug)}
                    className={cn(
                      'rounded-2xl border px-3 py-4 text-sm font-semibold transition-all duration-300',
                      episode.slug === currentEpisode.slug
                        ? 'border-rose-300/25 bg-rose-500/15 text-white'
                        : 'border-white/8 bg-black/28 text-white/68 hover:border-white/16 hover:bg-white/[0.08] hover:text-white'
                    )}
                  >
                    {episode.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/8 bg-white/[0.035] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/35">Đổi server</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {servers.map((server, index) => (
                  <button
                    key={`${server.server_name}-${index}`}
                    type="button"
                    onClick={() => selectServer(index)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300',
                      currentServerIndex === index
                        ? 'border-rose-300/25 bg-rose-500/15 text-rose-100'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    {server.server_name}
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-amber-300/10 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100/80">
                Nếu phim bị lag hoặc không tải được, hãy chuyển server khác. Khi một nguồn lỗi, player sẽ tự thử server kế tiếp.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PlayerExperience;

