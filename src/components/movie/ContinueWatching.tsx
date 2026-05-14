'use client';

import React from 'react';
import { useMovieStorage } from '@/hooks/useMovieStorage';
import MovieCarousel from './MovieCarousel';

const ContinueWatching: React.FC = () => {
  const { history, hydrated } = useMovieStorage();
  if (!hydrated || history.length === 0) return null;

  return (
    <MovieCarousel
      title="Tiep tuc xem"
      description="Cac tua ban vua mo se nam lai day de xem tiep cho nhanh."
      movies={history}
    />
  );
};

export default ContinueWatching;
