import React from 'react';
import { SkeletonCard } from '@/components/common/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background pb-20 pt-28">
      <div className="mx-auto max-w-[1560px] px-4 md:px-8 xl:px-12">
        <div className="mb-12 h-12 w-72 animate-pulse rounded-full bg-white/5" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
          {[...Array(12)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
