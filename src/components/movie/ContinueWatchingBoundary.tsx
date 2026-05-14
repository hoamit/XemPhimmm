'use client';

import dynamic from 'next/dynamic';

const ContinueWatching = dynamic(() => import('./ContinueWatching'), {
  ssr: false,
});

export default function ContinueWatchingBoundary() {
  return <ContinueWatching />;
}
