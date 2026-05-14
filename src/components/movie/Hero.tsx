'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import MovieImage from '@/components/common/MovieImage';
import FavoriteButton from '@/components/movie/FavoriteButton';
import { MovieDetail, MovieListItem } from '@/types/movie';

interface HeroProps {
  movie: MovieDetail | MovieListItem;
  spotlightMovies?: MovieListItem[];
  totalTitles?: number;
}

const Hero: React.FC<HeroProps> = ({ movie }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  if (!movie) {
    return (
      <section className="relative h-[95vh] w-full animate-pulse bg-zinc-900">
        <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/20 to-transparent" />
      </section>
    );
  }

  const movieContent = 'content' in movie ? movie.content : '';
  const title = movie.title || movie.name || 'Chưa rõ tên phim';

  return (
    <section ref={containerRef} className="relative min-h-[95vh] w-full overflow-hidden bg-black">
      <motion.div style={{ y }} className="absolute inset-0 z-0">
        <MovieImage
          src={movie.backdrop || movie.poster}
          alt={title}
          fill
          priority
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020202] via-transparent to-transparent" />
      </motion.div>

      <div className="animate-mesh absolute inset-0 opacity-20" />

      <motion.div 
        style={{ opacity }}
        className="relative z-10 mx-auto flex min-h-[95vh] max-w-[1560px] flex-col justify-end px-4 pb-20 pt-32 md:px-8 lg:px-12 lg:pb-24"
      >
        <div className="max-w-4xl space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-primary" />
              <p className="text-xs font-black uppercase tracking-[0.5em] text-primary">Phim Đề Cử</p>
            </div>
            
            <h1 className="font-display text-4xl font-black tracking-tighter text-white drop-shadow-2xl sm:text-6xl md:text-8xl">
              {title}
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-wrap items-center gap-4"
          >
            <div className="glass-premium rounded-2xl px-5 py-2.5">
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest mr-2">Năm</span>
              <span className="text-sm font-black text-white">{movie.year}</span>
            </div>
            <div className="glass-premium rounded-2xl px-5 py-2.5">
              <span className="text-xs font-bold text-white/40 uppercase tracking-widest mr-2">Bản đẹp</span>
              <span className="text-sm font-black text-white">{movie.quality || 'FHD'}</span>
            </div>
            {movie.lang ? (
              <div className="glass-premium rounded-2xl px-5 py-2.5">
                <span className="text-sm font-black text-white">{movie.lang}</span>
              </div>
            ) : null}
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="max-w-2xl line-clamp-3 text-lg font-medium leading-relaxed text-white/60 md:text-xl"
          >
            {movieContent.replace(/<[^>]*>/g, '') || movie.name}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-wrap items-center gap-6 pt-6"
          >
            <Link href={`/movie/${movie.slug}`} className="btn-primary">
              <Play className="size-6 fill-current" />
              Xem phim ngay
            </Link>
            <FavoriteButton movie={movie} className="btn-secondary" showText />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;

