'use client';

import React from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { FALLBACK_IMAGE_SRC, resolveImageUrl } from '@/lib/movie';

type MovieImageProps = Omit<ImageProps, 'alt' | 'src'> & {
  alt?: string | null;
  src?: string | null;
  skeletonClassName?: string;
};

export default function MovieImage({
  alt,
  className,
  onError,
  onLoad,
  skeletonClassName,
  src,
  ...props
}: MovieImageProps) {
  const normalizedSrc = React.useMemo(() => resolveImageUrl(src), [src]);
  const [currentSrc, setCurrentSrc] = React.useState(normalizedSrc);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    setCurrentSrc(normalizedSrc);
    setIsLoaded(false);
  }, [normalizedSrc]);

  return (
    <>
      {!isLoaded ? (
        <div
          className={cn(
            'absolute inset-0 animate-pulse bg-white/5',
            skeletonClassName
          )}
        />
      ) : null}

      <Image
        {...props}
        alt={alt || 'Movie artwork'}
        className={className}
        onError={(event) => {
          if (currentSrc !== FALLBACK_IMAGE_SRC) {
            setCurrentSrc(FALLBACK_IMAGE_SRC);
          } else {
            setIsLoaded(true);
          }

          onError?.(event);
        }}
        onLoad={(event) => {
          setIsLoaded(true);
          onLoad?.(event);
        }}
        src={currentSrc}
      />
    </>
  );
}
