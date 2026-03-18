'use client';

import React from 'react';
import Link from 'next/link';
import { Clapperboard, Film, Globe, Info, Play, Sparkles, Star, User } from 'lucide-react';
import { motion } from 'framer-motion';
import MovieImage from '@/components/common/MovieImage';
import MovieCarousel from '@/components/movie/MovieCarousel';
import FavoriteButton from '@/components/movie/FavoriteButton';
import { Episode, MovieDetail, MovieListItem } from '@/types/movie';
import { stripHtml } from '@/lib/utils';

interface MovieDetailViewProps {
  movie: MovieDetail;
  episodes: Episode[];
  relatedMovies: MovieListItem[];
}

export default function MovieDetailView({ movie, episodes, relatedMovies }: MovieDetailViewProps) {
  const backdropSrc = movie.backdrop || movie.poster;
  const posterSrc = movie.poster || movie.thumb;
  const summary = stripHtml(movie.content);
  const primaryServer = episodes[0]?.server_data || [];
  const title = movie.title || movie.name || 'Chưa rõ tên phim';

  return (
    <div className="min-h-screen pb-20" suppressHydrationWarning>
      <section className="relative min-h-[85vh] w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0 z-0"
        >
          <MovieImage
            src={backdropSrc}
            alt={title}
            fill
            priority
            className="object-cover object-top opacity-50 grayscale-[20%] will-change-transform"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020202] via-[#020202]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020202]/40 via-transparent to-transparent" />
        </motion.div>

        <div className="animate-mesh absolute inset-0 z-0 opacity-10" />

        <div className="relative z-10 mx-auto max-w-[1700px] px-4 pb-16 pt-32 md:px-8 xl:px-12">
          <div className="grid gap-12 xl:grid-cols-[380px_minmax(0,1fr)]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="hidden xl:block"
            >
              <div className="group relative aspect-[2/3] overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.8)] transition-transform duration-700 hover:scale-[1.02] will-change-transform">
                <MovieImage
                  src={posterSrc}
                  alt={title}
                  fill
                  sizes="380px"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <Link href={`/player/${movie.slug}`} className="btn-primary">
                  <Play className="size-5 fill-current" />
                  Phát ngay
                </Link>
                <FavoriteButton movie={movie} className="btn-secondary !px-0" showText />
              </div>
            </motion.div>

            <div className="flex flex-col justify-end pb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4">
                  <div className="h-px w-12 bg-primary" />
                  <p className="text-xs font-black uppercase tracking-[0.5em] text-primary">Thông tin phim</p>
                </div>

                <div className="space-y-4">
                  <h1 className="font-display text-5xl font-black tracking-tight text-white drop-shadow-2xl md:text-8xl">
                    {title}
                  </h1>
                  {movie.origin_name ? (
                    <p className="text-xl font-medium tracking-wide text-white/40 md:text-2xl">{movie.origin_name}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="glass-premium rounded-2xl px-5 py-2.5">
                    <span className="mr-2 text-xs font-bold uppercase tracking-widest text-white/30">Năm</span>
                    <span className="text-sm font-black text-white">{movie.year || 'Đang cập nhật'}</span>
                  </div>
                  <div className="glass-premium rounded-2xl px-5 py-2.5">
                    <span className="mr-2 text-xs font-bold uppercase tracking-widest text-white/30">Bản</span>
                    <span className="text-sm font-black text-white">{movie.quality || 'FHD'}</span>
                  </div>
                  {movie.lang ? (
                    <div className="glass-premium rounded-2xl px-5 py-2.5">
                      <span className="text-sm font-black text-white">{movie.lang}</span>
                    </div>
                  ) : null}
                  <div className="glass-premium rounded-2xl px-5 py-2.5">
                    <Star className="mb-0.5 mr-2 inline size-4 fill-current text-amber-400" />
                    <span className="text-sm font-black text-white">{movie.episode_current || 'Full'}</span>
                  </div>
                </div>

                <p className="max-w-3xl text-lg font-medium leading-relaxed text-white/60 md:text-xl">
                  {summary || 'Nội dung phim đang được cập nhật.'}
                </p>

                <div className="flex gap-4 pt-4 xl:hidden">
                  <Link href={`/player/${movie.slug}`} className="btn-primary flex-1">
                    <Play className="size-5 fill-current" />
                    Phát ngay
                  </Link>
                  <FavoriteButton movie={movie} className="btn-secondary !px-0" showText />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-20 space-y-12 px-4 md:px-8 xl:px-12">
        <div className="mx-auto grid max-w-[1700px] gap-8 xl:grid-cols-[1fr_400px]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-premium rounded-[2.5rem] p-8 md:p-12"
          >
            <div className="mb-8 flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-3xl font-display font-black text-white">Danh sách tập</h2>
                <p className="text-sm font-medium text-white/40">Chọn tập để bắt đầu hành trình điện ảnh của bạn.</p>
              </div>
              <div className="hidden items-center gap-2.5 rounded-full border-white/5 bg-white/5 px-4 py-1.5 glass-card sm:flex">
                <Info className="size-3.5 text-white/40" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Có thể đổi server trong trình phát</span>
              </div>
            </div>

            {primaryServer.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {primaryServer.map((episode, idx) => (
                  <Link
                    key={episode.slug || `${movie.slug}-episode-${idx}`}
                    href={`/player/${movie.slug}?ep=${episode.slug}`}
                    className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/5 px-2 py-3.5 text-center transition-all duration-300 hover:scale-[1.05] hover:border-primary/40 hover:bg-primary/5 will-change-transform"
                  >
                    <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/30 group-hover:text-primary/60">TẬP</p>
                      <p className="mt-1 text-base font-display font-black text-white">
                        {episode.name.replace('Tập ', '')}
                      </p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/2 py-12">
                <Clapperboard className="mb-4 size-12 text-white/10" />
                <p className="font-medium tracking-wide text-white/40">Chưa có dữ liệu tập phim cho server này.</p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="glass-premium space-y-8 rounded-[2.5rem] p-8">
              <h2 className="text-2xl font-display font-black text-white">Thông tin chi tiết</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10">
                    <User className="size-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-white/30">Diễn viên</p>
                    <p className="text-sm font-bold leading-relaxed text-white/80">
                      {movie.actor.slice(0, 10).join(', ') || 'Đang cập nhật'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-400/20 bg-amber-400/10">
                    <Clapperboard className="size-5 text-amber-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-white/30">Đạo diễn</p>
                    <p className="text-sm font-bold leading-relaxed text-white/80">
                      {movie.director.join(', ') || 'Đang cập nhật'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-sky-400/20 bg-sky-400/10">
                    <Globe className="size-5 text-sky-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-white/30">Quốc gia</p>
                    <p className="text-sm font-bold leading-relaxed text-white/80">
                      {movie.country[0]?.name || 'Đang cập nhật'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                    <Film className="size-5 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-white/30">Thể loại</p>
                    <p className="text-sm font-bold leading-relaxed text-white/80">
                      {movie.category.map((item) => item.name).join(', ') || 'Đang cập nhật'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-premium group relative overflow-hidden rounded-[2.5rem] border-primary/20 p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
              <div className="relative z-10 space-y-4">
                <div className="grid size-10 place-items-center rounded-full bg-primary shadow-[0_0_20px_rgba(225,29,72,0.4)]">
                  <Sparkles className="size-5 text-white" />
                </div>
                <h3 className="text-xl font-display font-black text-white">Trải nghiệm tuyệt vời hơn</h3>
                <p className="text-sm font-medium leading-relaxed text-white/50">
                  Đăng ký nhận thông báo để không bỏ lỡ các tập mới nhất của bộ phim này. XemPhimmm luôn cập nhật nội dung nhanh nhất cho bạn.
                </p>
                <button className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-white/10">
                  Nhận thông báo
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="pt-12">
          <MovieCarousel
            title="Đề cử dành cho bạn"
            description="Lấy cảm hứng từ những gì bạn đang xem."
            movies={relatedMovies}
            accent="from-primary/30 via-primary/10 to-transparent"
          />
        </div>
      </div>
    </div>
  );
}
