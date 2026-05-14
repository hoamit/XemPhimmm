'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MovieListItem } from '@/types/movie';
import MovieCard from './MovieCard';
import { cn, dedupeMovies } from '@/lib/utils';

interface MovieCarouselProps {
  title: string;
  movies: MovieListItem[];
  description?: string;
  href?: string;
  accent?: string;
}

const MovieCarousel: React.FC<MovieCarouselProps> = ({
  title,
  movies,
  description,
  href,
  accent,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const uniqueMovies = useMemo(() => dedupeMovies(movies || []), [movies]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const update = () => {
      setCanScrollLeft(scroller.scrollLeft > 20);
      setCanScrollRight(scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 20);
    };

    update();
    scroller.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      scroller.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [uniqueMovies.length]);

  const scrollByAmount = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    
    // Netflix style pagination (roughly width of viewport)
    const amount = scroller.clientWidth * 0.85;
    scroller.scrollBy({
      left: direction * amount,
      behavior: 'smooth',
    });
  };

  if (!uniqueMovies.length) return null;

  return (
    <section className="group/section relative py-6">
      <div
        className={cn(
          'pointer-events-none absolute inset-x-4 top-8 h-32 rounded-full bg-gradient-to-r opacity-20 blur-3xl md:inset-x-8 xl:inset-x-12',
          accent || 'from-white/10 via-transparent to-transparent'
        )}
      />

      <div className="mx-auto max-w-[1560px] px-4 md:px-8 xl:px-12">
        <div className="relative flex items-end justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-[2px] w-6 bg-primary" />
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary/80">
                {title.toLowerCase().includes('hot') ? 'Trending Now' : 'Must Watch'}
              </p>
            </div>
            <h2 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">{title}</h2>
            {description ? <p className="max-w-2xl text-base font-medium text-white/40 md:text-lg">{description}</p> : null}
          </motion.div>

          {href && (
            <Link
              href={href}
              className="mb-1 hidden items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white/50 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Tất cả
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>

        <div className="relative mt-8">
          <AnimatePresence>
            {canScrollLeft && (
              <motion.button
                key="prev-button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => scrollByAmount(-1)}
                className="absolute left-0 z-30 hidden h-full w-16 items-center justify-center bg-gradient-to-r from-black/80 to-transparent text-white opacity-0 transition-opacity group-hover/section:opacity-100 md:flex"
              >
                <div className="grid size-12 place-items-center rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
                  <ArrowLeft className="size-6" />
                </div>
              </motion.button>
            )}

            {canScrollRight && (
              <motion.button
                key="next-button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => scrollByAmount(1)}
                className="absolute right-0 z-30 hidden h-full w-16 items-center justify-center bg-gradient-to-l from-black/80 to-transparent text-white opacity-0 transition-opacity group-hover/section:opacity-100 md:flex"
              >
                <div className="grid size-12 place-items-center rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
                  <ArrowRight className="size-6" />
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          <div
            ref={scrollerRef}
            className="hide-scrollbar snap-x snap-mandatory overflow-x-auto"
          >
            <div className="flex gap-4 md:gap-6">
              {uniqueMovies.map((movie, index) => (
                <motion.div
                  key={`${movie.slug}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="w-[44vw] min-w-[170px] max-w-[240px] shrink-0 snap-start md:w-[28vw] lg:w-[20vw] xl:w-[16.5vw]"
                >
                  <MovieCard movie={movie} priority={index < 6} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MovieCarousel;
