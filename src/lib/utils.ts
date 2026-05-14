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
  const seenSlugs = new Set<string>();
  const seenFallbackKeys = new Set<string>();

  return movies.filter((movie) => {
    const slugKey = (movie.slug || '').trim().toLowerCase();
    if (slugKey) {
      if (seenSlugs.has(slugKey)) {
        return false;
      }

      seenSlugs.add(slugKey);
      return true;
    }

    const fallbackKey = `${(movie.name || movie.title || '').trim().toLowerCase()}::${movie.year || ''}`;
    if (!fallbackKey || seenFallbackKeys.has(fallbackKey)) {
      return false;
    }

    seenFallbackKeys.add(fallbackKey);
    return true;
  });
}

const SEQUEL_PATTERN =
  /\b(?:phan|season|ss?|part|tap|episode|ep|chuong|chapter)\s*(?:\d+|[ivxlcdm]+)\b/i;
const BRACKETED_SEQUEL_PATTERN =
  /\(\s*(?:phan|season|ss?|part|tap|episode|ep|chuong|chapter)\s*(?:\d+|[ivxlcdm]+)\s*\)/gi;
const INLINE_SEQUEL_PATTERN =
  /\b(?:phan|season|ss?|part|tap|episode|ep|chuong|chapter)\s*(?:\d+|[ivxlcdm]+)\b/gi;

function normalizeTitleToken(value: string) {
  return stripHtml(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function hasSequelMarker(value: string) {
  return SEQUEL_PATTERN.test(normalizeTitleToken(value));
}

function createFranchiseKey(value: string) {
  return normalizeTitleToken(value)
    .replace(BRACKETED_SEQUEL_PATTERN, ' ')
    .replace(INLINE_SEQUEL_PATTERN, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function dedupeMoviesByFranchise<T extends MovieListItem>(movies: T[]) {
  const uniqueBySlug = dedupeMovies(movies);
  const seenFranchises = new Set<string>();

  return uniqueBySlug.filter((movie) => {
    const rawTitle = stripHtml(movie.title || movie.name || movie.origin_name || '');
    if (!rawTitle) {
      return false;
    }

    if (!hasSequelMarker(rawTitle)) {
      return true;
    }

    const franchiseKey = createFranchiseKey(rawTitle);
    if (!franchiseKey) {
      return true;
    }

    if (seenFranchises.has(franchiseKey)) {
      return false;
    }

    seenFranchises.add(franchiseKey);
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
