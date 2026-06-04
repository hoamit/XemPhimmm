'use client';

import dynamic from 'next/dynamic';

const FavoritesLane = dynamic(() => import('./FavoritesLane'), {
  ssr: false,
});

export default function FavoritesBoundary() {
  return <FavoritesLane />;
}
