import {
  Episode,
  EpisodeServerData,
  MovieCategory,
  MovieCountry,
  MovieDetail,
  MovieListItem,
} from '@/types/movie';

export const FALLBACK_IMAGE_SRC = '/fallback.jpg';

const DEFAULT_IMAGE_BASE = 'https://phimimg.com';

const HOST_ALIASES = new Map<string, string>([
  ['img.ophim.live', 'phimimg.com'],
  ['img.ophim1.com', 'phimimg.com'],
  ['img.ophim.org', 'phimimg.com'],
  ['img.kkphim.com', 'phimimg.com'],
  ['img.kkphim.live', 'phimimg.com'],
  ['img.phimapi.com', 'phimimg.com'],
  ['media.cdn.phimapi.com', 'phimimg.com'],
  ['ophim1.com', 'phimimg.com'],
  ['ophim.cc', 'phimimg.com'],
  ['kkphim.com', 'phimimg.com'],
]);

export type ApiMovieLike = Partial<MovieListItem> &
  Partial<MovieDetail> & {
    title?: string | null;
    poster?: string | null;
    thumb?: string | null;
    backdrop?: string | null;
    poster_url?: string | null;
    thumb_url?: string | null;
    pathImage?: string | null;
    domain_image?: string | null;
    APP_DOMAIN_CDN_IMAGE?: string | null;
  };

function safeString(value: unknown, fallback = '') {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return fallback;
}

function safeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value === 'true' || value === '1';
  }

  return Boolean(value);
}

function safeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => safeString(item)).filter(Boolean);
}

function normalizeTaxonomyItem<T extends MovieCategory | MovieCountry>(value: unknown): T | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const item = value as Record<string, unknown>;
  const name = safeString(item.name);
  const slug = safeString(item.slug);

  if (!name && !slug) {
    return null;
  }

  return {
    id: safeString(item.id || slug || name),
    name: name || slug,
    slug: slug || name,
  } as T;
}

function normalizeTaxonomyArray<T extends MovieCategory | MovieCountry>(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as T[];
  }

  return value
    .map((item) => normalizeTaxonomyItem<T>(item))
    .filter((item): item is T => Boolean(item));
}

function ensureTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`;
}

function normalizeHost(url: URL) {
  const alias = HOST_ALIASES.get(url.hostname);

  if (alias) {
    url.hostname = alias;
    url.protocol = 'https:';
  }

  if (url.protocol === 'http:') {
    url.protocol = 'https:';
  }

  url.pathname = url.pathname
    .replace(/\/{2,}/g, '/')
    .replace(/(\/uploads\/movies)+\/uploads\/movies/g, '/uploads/movies');

  return url;
}

export function resolveImageBase(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const value = safeString(candidate);

    if (!value) {
      continue;
    }

    try {
      const url = value.startsWith('http')
        ? new URL(value)
        : new URL(value, ensureTrailingSlash(DEFAULT_IMAGE_BASE));

      return normalizeHost(url).toString();
    } catch {
      continue;
    }
  }

  return DEFAULT_IMAGE_BASE;
}

export function resolveImageUrl(
  value: string | null | undefined,
  base: string = DEFAULT_IMAGE_BASE,
  fallback: string = FALLBACK_IMAGE_SRC
) {
  const candidate = safeString(value);

  if (!candidate) {
    return fallback;
  }

  if (candidate === fallback) {
    return fallback;
  }

  try {
    const normalizedValue = candidate.startsWith('//') ? `https:${candidate}` : candidate;
    const url = normalizedValue.startsWith('http')
      ? new URL(normalizedValue)
      : new URL(normalizedValue, ensureTrailingSlash(base));

    return normalizeHost(url).toString();
  } catch {
    return fallback;
  }
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  return values.find((value) => safeString(value).length > 0);
}

export function isFallbackImage(src: string | null | undefined) {
  return !safeString(src) || safeString(src) === FALLBACK_IMAGE_SRC;
}

export function normalizeMovie(apiMovie: ApiMovieLike, imageBase?: string): MovieListItem {
  const resolvedImageBase = resolveImageBase(
    imageBase,
    safeString(apiMovie.pathImage),
    safeString(apiMovie.domain_image),
    safeString(apiMovie.APP_DOMAIN_CDN_IMAGE)
  );
  const title = firstNonEmpty(
    safeString(apiMovie.title),
    safeString(apiMovie.name),
    safeString(apiMovie.origin_name),
    'Chưa rõ tên phim'
  )!;
  const poster = resolveImageUrl(
    firstNonEmpty(
      safeString(apiMovie.poster_url),
      safeString(apiMovie.thumb_url),
      safeString(apiMovie.poster),
      safeString(apiMovie.thumb),
      safeString(apiMovie.backdrop)
    ),
    resolvedImageBase
  );
  const thumb = resolveImageUrl(
    firstNonEmpty(
      safeString(apiMovie.thumb_url),
      safeString(apiMovie.poster_url),
      safeString(apiMovie.thumb),
      safeString(apiMovie.poster),
      safeString(apiMovie.backdrop)
    ),
    resolvedImageBase
  );
  const backdrop = resolveImageUrl(
    firstNonEmpty(
      safeString(apiMovie.backdrop),
      safeString(apiMovie.poster_url),
      safeString(apiMovie.thumb_url),
      safeString(apiMovie.poster),
      safeString(apiMovie.thumb)
    ),
    resolvedImageBase
  );

  return {
    title,
    name: title,
    origin_name: safeString(apiMovie.origin_name),
    thumb_url: thumb,
    poster_url: poster,
    poster,
    thumb,
    backdrop,
    slug: safeString(apiMovie.slug),
    year: safeNumber(apiMovie.year),
    quality: safeString(apiMovie.quality) || undefined,
    episode_current: safeString(apiMovie.episode_current) || undefined,
    lang: safeString(apiMovie.lang) || undefined,
    time: safeString(apiMovie.time) || undefined,
  };
}

export function normalizeEpisodeServerData(value: unknown, index: number): EpisodeServerData | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const item = value as Record<string, unknown>;
  const name = safeString(item.name, `Tập ${index + 1}`);
  const slug = safeString(item.slug || item.filename || item.name, `tap-${index + 1}`);
  const linkM3u8 = safeString(item.link_m3u8);
  const linkEmbed = safeString(item.link_embed);

  if (!slug || (!linkM3u8 && !linkEmbed)) {
    return null;
  }

  return {
    name,
    slug,
    filename: safeString(item.filename, slug),
    link_m3u8: linkM3u8,
    link_embed: linkEmbed,
  };
}

export function normalizeEpisodes(value: unknown): Episode[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((server, serverIndex) => {
      if (!server || typeof server !== 'object') {
        return null;
      }

      const serverRecord = server as Record<string, unknown>;
      const serverName = safeString(serverRecord.server_name, `Server ${serverIndex + 1}`);
      const serverData = Array.isArray(serverRecord.server_data)
        ? serverRecord.server_data
            .map((episode, index) => normalizeEpisodeServerData(episode, index))
            .filter((episode): episode is EpisodeServerData => Boolean(episode))
        : [];

      if (!serverData.length) {
        return {
          server_name: serverName,
          server_data: [],
        };
      }

      return {
        server_name: serverName,
        server_data: serverData,
      };
    })
    .filter((server): server is Episode => Boolean(server));
}

export function normalizeMovieDetail(apiMovie: ApiMovieLike, imageBase?: string): MovieDetail {
  const normalizedMovie = normalizeMovie(apiMovie, imageBase);

  return {
    ...normalizedMovie,
    content: safeString(apiMovie.content),
    type: safeString(apiMovie.type),
    status: safeString(apiMovie.status),
    is_copyright: safeBoolean(apiMovie.is_copyright),
    sub_docquyen: safeBoolean(apiMovie.sub_docquyen),
    chieurap: safeBoolean(apiMovie.chieurap),
    trailer_url: safeString(apiMovie.trailer_url),
    episode_total: safeString(apiMovie.episode_total),
    notify: safeString(apiMovie.notify),
    showtimes: safeString(apiMovie.showtimes),
    view: safeNumber(apiMovie.view),
    actor: safeStringArray(apiMovie.actor),
    director: safeStringArray(apiMovie.director),
    category: normalizeTaxonomyArray<MovieCategory>(apiMovie.category),
    country: normalizeTaxonomyArray<MovieCountry>(apiMovie.country),
    quality: safeString(apiMovie.quality),
    lang: safeString(apiMovie.lang),
    time: safeString(apiMovie.time),
    episode_current: safeString(apiMovie.episode_current),
  };
}
