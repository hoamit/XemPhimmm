import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MovieListItem } from '@/types/movie';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function stripHtml(value: string | null | undefined) {
  return (value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function dedupeMovies<T extends MovieListItem>(movies: T[]) {
  const seen = new Set<string>();

  return movies.filter((movie) => {
    const key = (movie.slug || movie.name || '').trim().toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function formatCompactNumber(value: number | null | undefined) {
  const safeValue = value ?? 0;

  return new Intl.NumberFormat('vi-VN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(safeValue);
}
