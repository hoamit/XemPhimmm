'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { normalizeMovie } from '@/lib/movie';
import { useMovieStorage } from '@/hooks/useMovieStorage';
import { MovieListItem } from '@/types/movie';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  movie: MovieListItem;
  className?: string;
  showText?: boolean;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ movie, className, showText = false }) => {
  const { toggleFavorite, isFavorite, hydrated } = useMovieStorage();
  const favorite = hydrated ? isFavorite(movie.slug) : false;
  const movieItem = normalizeMovie(movie);

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(movieItem)}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-all duration-300",
        favorite
          ? "border-rose-300/30 bg-rose-500/15 text-rose-100"
          : "border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10 hover:text-white",
        className
      )}
    >
      <Heart className={cn("w-5 h-5", favorite && "fill-current")} />
      {showText && (favorite ? 'Đã thích' : 'Yêu thích')}
    </button>
  );
};

export default FavoriteButton;
