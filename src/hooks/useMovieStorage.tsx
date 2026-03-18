'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { normalizeMovie } from '@/lib/movie';
import { MovieListItem } from '@/types/movie';

interface WatchHistoryItem extends MovieListItem {
  lastWatched: number;
}

interface MovieStorageContextValue {
  hydrated: boolean;
  favorites: MovieListItem[];
  history: WatchHistoryItem[];
  toggleFavorite: (movie: MovieListItem) => void;
  addToHistory: (movie: MovieListItem) => void;
  isFavorite: (slug: string) => boolean;
}

const FAVORITES_KEY = 'xemphimmm_favorites';
const HISTORY_KEY = 'xemphimmm_history';

const MovieStorageContext = createContext<MovieStorageContextValue | null>(null);

function normalizeStoredMovies(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as MovieListItem[];
  }

  return value
    .map((item) => normalizeMovie((item || {}) as MovieListItem))
    .filter((movie) => Boolean(movie.slug));
}

function readStorage(key: string) {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return [];
    }

    return normalizeStoredMovies(JSON.parse(value));
  } catch {
    return [];
  }
}

export function MovieStorageProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [favorites, setFavorites] = useState<MovieListItem[]>([]);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  useEffect(() => {
    try {
      setFavorites(readStorage(FAVORITES_KEY));
      setHistory(readStorage(HISTORY_KEY) as WatchHistoryItem[]);
    } catch {
      setFavorites([]);
      setHistory([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === FAVORITES_KEY) {
        setFavorites(event.newValue ? normalizeStoredMovies(JSON.parse(event.newValue)) : []);
      }

      if (event.key === HISTORY_KEY) {
        setHistory(
          event.newValue ? (normalizeStoredMovies(JSON.parse(event.newValue)) as WatchHistoryItem[]) : []
        );
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleFavorite = useCallback((movie: MovieListItem) => {
    const normalizedMovie = normalizeMovie(movie);

    setFavorites((previous) => {
      const exists = previous.some((item) => item.slug === normalizedMovie.slug);
      const updated = exists
        ? previous.filter((item) => item.slug !== normalizedMovie.slug)
        : [normalizedMovie, ...previous].slice(0, 60);

      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addToHistory = useCallback((movie: MovieListItem) => {
    const normalizedMovie = normalizeMovie(movie);

    setHistory((previous) => {
      const item: WatchHistoryItem = { ...normalizedMovie, lastWatched: Date.now() };
      const updated = [item, ...previous.filter((entry) => entry.slug !== normalizedMovie.slug)].slice(0, 30);

      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFavorite = useCallback(
    (slug: string) => favorites.some((movie) => movie.slug === slug),
    [favorites]
  );

  const value = useMemo(
    () => ({
      hydrated,
      favorites,
      history,
      toggleFavorite,
      addToHistory,
      isFavorite,
    }),
    [addToHistory, favorites, history, hydrated, isFavorite, toggleFavorite]
  );

  return <MovieStorageContext.Provider value={value}>{children}</MovieStorageContext.Provider>;
}

export function useMovieStorage() {
  const context = useContext(MovieStorageContext);

  if (!context) {
    throw new Error('useMovieStorage must be used within MovieStorageProvider');
  }

  return context;
}
