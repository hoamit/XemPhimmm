'use client';

import React from 'react';
import { useMovieStorage } from '@/hooks/useMovieStorage';
import MovieCarousel from './MovieCarousel';

const ContinueWatching: React.FC = () => {
  const { history, hydrated } = useMovieStorage();

  if (!hydrated || history.length === 0) return null;

  return (
    <MovieCarousel 
      title="Tiếp tục xem"
      description="Các tựa bạn vừa mở sẽ nằm lại đây để xem tiếp cho nhanh."
      movies={history}
    />
  );
};

export default ContinueWatching;
