import React from 'react';
import { SkeletonHero, SkeletonCard } from '@/components/common/Skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <SkeletonHero />
      <div className="mx-auto max-w-[1560px] space-y-16 px-4 py-12 md:px-8 xl:px-12">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-6">
            <div className="h-8 w-56 animate-pulse rounded-full bg-white/5" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {[...Array(6)].map((_, j) => (
                <SkeletonCard key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

