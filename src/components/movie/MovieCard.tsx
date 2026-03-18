'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import MovieImage from '@/components/common/MovieImage';
import { MovieListItem } from '@/types/movie';
import { cn } from '@/lib/utils';
import { useMovieStorage } from '@/hooks/useMovieStorage';

interface MovieCardProps {
  movie: MovieListItem;
  priority?: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, priority = false }) => {
  const { toggleFavorite, isFavorite, hydrated } = useMovieStorage();
  const favorite = hydrated ? isFavorite(movie.slug) : false;
  const title = movie.title || movie.name || 'Chưa rõ tên phim';

  return (
    <motion.article 
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative h-full min-w-0"
    >
      <Link href={`/movie/${movie.slug}`} className="block h-full">
        <div className="relative overflow-hidden rounded-[2rem] bg-surface border border-white/5 shadow-2xl transition-all duration-500 group-hover:border-primary/20 group-hover:shadow-primary/10">
          <div className="movie-card-glow" />
          
          <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900/50">
            <MovieImage
              src={movie.poster}
              alt={title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 28vw, 18vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

            <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
              {movie.quality ? (
                <span className="movie-chip border-white/10 text-white">
                  {movie.quality}
                </span>
              ) : null}
              {movie.episode_current && !movie.episode_current.includes('Full') ? (
                <span className="movie-chip border-primary/20 text-primary">
                  {movie.episode_current}
                </span>
              ) : null}
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5 pt-20 bg-gradient-to-t from-black via-black/40 to-transparent">
              <div className="flex flex-col gap-1">
                <h3 className="line-clamp-2 font-display text-xl font-bold leading-tight text-white group-hover:text-primary transition-colors duration-300">
                  {title}
                </h3>
                <div className="flex items-center gap-2 text-xs font-semibold text-white/40">
                  {movie.year ? <span>{movie.year}</span> : null}
                  {movie.lang ? <span className="text-white/20">•</span> : null}
                  {movie.lang ? <span className="truncate">{movie.lang}</span> : null}
                </div>
              </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 scale-90 group-hover:opacity-100 group-hover:scale-100">
              <div className="grid size-14 place-items-center rounded-full bg-primary text-white shadow-[0_0_30px_rgba(215,25,45,0.6)]">
                <Play className="size-7 fill-current ml-1" />
              </div>
            </div>
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleFavorite(movie);
        }}
        className={cn(
          'absolute right-3 top-3 z-20 grid size-10 place-items-center rounded-full border border-white/10 bg-black/40 text-white/70 backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-black/60 hover:text-white',
          favorite && 'border-primary/40 bg-primary/10 text-primary'
        )}
      >
        <Heart className={cn('size-4', favorite && 'fill-current')} />
      </button>
    </motion.article>
  );
};

export default MovieCard;
