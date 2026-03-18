'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl bg-white/5',
        className
      )}
    />
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[2/3] w-full rounded-[1.7rem]" />
      <Skeleton className="h-4 w-3/4 rounded-full" />
      <Skeleton className="h-3 w-1/2 rounded-full" />
    </div>
  );
};

export const SkeletonHero: React.FC = () => {
  return (
    <div className="relative h-[82vh] overflow-hidden rounded-b-[2.5rem] bg-black">
      <Skeleton className="h-full w-full rounded-none" />
      <div className="absolute bottom-12 left-4 right-4 grid gap-6 md:left-8 md:right-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:left-12 xl:right-12">
        <div className="space-y-4">
          <Skeleton className="h-8 w-36 rounded-full" />
          <Skeleton className="h-16 w-full max-w-2xl rounded-[1.6rem]" />
          <Skeleton className="h-6 w-2/3 rounded-full" />
          <Skeleton className="h-24 w-full max-w-3xl rounded-[1.6rem]" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-36 rounded-full" />
            <Skeleton className="h-12 w-36 rounded-full" />
          </div>
        </div>

        <div className="space-y-3">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-[1.4rem]" />
          ))}
        </div>
      </div>
    </div>
  );
};
