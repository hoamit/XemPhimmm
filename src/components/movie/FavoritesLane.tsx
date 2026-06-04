'use client';

import React from 'react';
import { useMovieStorage } from '@/hooks/useMovieStorage';
import MovieCarousel from './MovieCarousel';

const FavoritesLane: React.FC = () => {
  const { favorites, hydrated } = useMovieStorage();
  if (!hydrated || favorites.length === 0) return null;

  return (
    <MovieCarousel
      title="Danh sách yêu thích"
      description="Các bộ phim bạn đã đánh dấu yêu thích sẽ được lưu trữ tại đây."
      movies={favorites}
      accent="from-rose-500/30 via-rose-500/10 to-transparent"
    />
  );
};

export default FavoritesLane;
