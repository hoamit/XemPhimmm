import { apiClient } from '@/lib/api/client';
import { isFallbackImage } from '@/lib/movie';
import { MovieDetail, MovieListItem } from '@/types/movie';
import { dedupeMovies, dedupeMoviesByFranchise, stripHtml } from '@/lib/utils';

export const TYPE_CONFIG: Record<
  string,
  {
    label: string;
    description: string;
    tagline: string;
    fetchCount: number;
    accent: string;
  }
> = {
  'phim-bo': {
    label: 'Phim bộ',
    description: 'Series dài tập đang được cập nhật liên tục.',
    tagline: 'Binge-worthy serials',
    fetchCount: 5,
    accent: 'from-sky-400/30 via-cyan-300/10 to-transparent',
  },
  'phim-le': {
    label: 'Phim lẻ',
    description: 'Bom tấn điện ảnh, phim chiếu rạp và các title đáng xem cuối tuần.',
    tagline: 'Big screen energy',
    fetchCount: 5,
    accent: 'from-amber-300/30 via-orange-300/10 to-transparent',
  },
  'hoat-hinh': {
    label: 'Hoạt hình',
    description: 'Anime, animation và thế giới fantasy giàu hình ảnh.',
    tagline: 'Animation universe',
    fetchCount: 4,
    accent: 'from-fuchsia-400/30 via-pink-300/10 to-transparent',
  },
  'tv-shows': {
    label: 'TV Shows',
    description: 'Gameshow, reality show và nội dung giải trí đang hot.',
    tagline: 'Showtime picks',
    fetchCount: 4,
    accent: 'from-emerald-400/30 via-lime-300/10 to-transparent',
  },
};

export const NAV_LINKS = [
  { name: 'Trang chủ', href: '/' },
  ...Object.entries(TYPE_CONFIG).map(([type, config]) => ({
    name: config.label,
    href: `/type/${type}`,
  })),
];

export const HOME_DISCOVER_CARDS = [
  {
    title: 'Kho phim dày hơn',
    description: 'Gộp nhiều page hơn nên số title không còn bị “mỏng”.',
    href: '/type/phim-le',
  },
  {
    title: 'Series cày xuyên đêm',
    description: 'Phim bộ được kéo nhiều trang để có thêm tập mới và title hot.',
    href: '/type/phim-bo',
  },
  {
    title: 'Animation & anime',
    description: 'Một lane riêng cho hoạt hình để không bị lẫn vào các danh mục khác.',
    href: '/type/hoat-hinh',
  },
  {
    title: 'Search nhanh và sạch',
    description: 'Trang tìm kiếm chuyển sang server render để ổn định hơn.',
    href: '/search',
  },
];

function pickHeroCandidate(movies: MovieListItem[]) {
  return movies.find(
    (movie) =>
      movie.slug &&
      !isFallbackImage(movie.poster) &&
      stripHtml(movie.title).length > 0
  );
}

function takeUniqueMovies(
  movies: MovieListItem[],
  limit: number,
  usedSlugs?: Set<string>
) {
  const unique = dedupeMoviesByFranchise(movies);

  if (!usedSlugs) {
    return unique.slice(0, limit);
  }

  const selected: MovieListItem[] = [];
  for (const movie of unique) {
    const slug = movie.slug.trim().toLowerCase();
    if (!slug || usedSlugs.has(slug)) {
      continue;
    }

    usedSlugs.add(slug);
    selected.push(movie);

    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}

export async function getHomePageData() {
  const [latest, series, singles, animation, shows] = await Promise.all([
    apiClient.getLatestMovies(1, 2),
    apiClient.getMoviesByFilter('phim-bo', 1, 2),
    apiClient.getMoviesByFilter('phim-le', 1, 2),
    apiClient.getMoviesByFilter('hoat-hinh', 1, 2),
    apiClient.getMoviesByFilter('tv-shows', 1, 2),
  ]);

  const spotlightPool = dedupeMovies([
    ...latest.items.slice(0, 12),
    ...singles.items.slice(0, 10),
    ...series.items.slice(0, 10),
  ]);
  const heroCandidate = pickHeroCandidate(spotlightPool) || latest.items[0];
  const usedSlugs = new Set<string>();

  let heroMovie: MovieDetail | null = null;
  if (heroCandidate?.slug) {
    try {
      const detail = await apiClient.getMovieDetail(heroCandidate.slug);
      heroMovie = detail.movie;
    } catch {
      heroMovie = null;
    }
  }

  const sections = [
    {
      title: 'Mới cập nhật',
      subtitle: 'Nhiều trang phim mới nhất được gộp lại để feed luôn dày.',
      href: '/search?q=phim',
      accent: 'from-rose-400/35 via-orange-300/10 to-transparent',
      movies: takeUniqueMovies(latest.items, 24, usedSlugs),
    },
    {
      title: TYPE_CONFIG['phim-bo'].label,
      subtitle: TYPE_CONFIG['phim-bo'].description,
      href: '/type/phim-bo',
      accent: TYPE_CONFIG['phim-bo'].accent,
      movies: takeUniqueMovies(series.items, 24, usedSlugs),
    },
    {
      title: TYPE_CONFIG['phim-le'].label,
      subtitle: TYPE_CONFIG['phim-le'].description,
      href: '/type/phim-le',
      accent: TYPE_CONFIG['phim-le'].accent,
      movies: takeUniqueMovies(singles.items, 24, usedSlugs),
    },
    {
      title: 'Tuyển chọn cuối tuần',
      subtitle: 'Mix phim lẻ, phim bộ và title mới để mở vào là xem ngay.',
      href: '/search?q=hay',
      accent: 'from-violet-400/30 via-blue-300/10 to-transparent',
      movies: takeUniqueMovies(
        dedupeMovies([
        ...singles.items.slice(0, 12),
        ...series.items.slice(0, 12),
        ...latest.items.slice(0, 8),
        ]),
        24,
        usedSlugs
      ),
    },
    {
      title: TYPE_CONFIG['hoat-hinh'].label,
      subtitle: TYPE_CONFIG['hoat-hinh'].description,
      href: '/type/hoat-hinh',
      accent: TYPE_CONFIG['hoat-hinh'].accent,
      movies: takeUniqueMovies(animation.items, 24, usedSlugs),
    },
    {
      title: TYPE_CONFIG['tv-shows'].label,
      subtitle: TYPE_CONFIG['tv-shows'].description,
      href: '/type/tv-shows',
      accent: TYPE_CONFIG['tv-shows'].accent,
      movies: takeUniqueMovies(shows.items, 24, usedSlugs),
    },
  ];

  const totalTitles = dedupeMovies([
    ...latest.items,
    ...series.items,
    ...singles.items,
    ...animation.items,
    ...shows.items,
  ]).length;

  return {
    heroMovie,
    spotlightMovies: spotlightPool.slice(0, 4),
    sections,
    totalTitles,
  };
}

export function getTypeConfig(type: string) {
  return (
    TYPE_CONFIG[type] || {
      label: 'Danh mục',
      description: 'Kho phim được cập nhật từ nhiều nguồn.',
      tagline: 'Fresh catalog',
      fetchCount: 4,
      accent: 'from-white/20 to-transparent',
    }
  );
}

export async function getTypePageData(type: string, page: number = 1, extraParams: Record<string, string | number | undefined> = {}) {
  const config = getTypeConfig(type);
  const response = await apiClient.getMoviesByFilter(type, page, 1, extraParams);
  const uniqueItems = dedupeMoviesByFranchise(response.items);
  const perPage = Math.max(1, Number(response.pagination?.totalItemsPerPage || 24));
  const pageItems = uniqueItems.slice(0, perPage);

  return {
    config,
    movies: pageItems,
    pagination: response.pagination,
    spotlight: dedupeMovies([
      ...pageItems.filter((movie) => movie.year >= 2024),
      ...pageItems,
    ]).slice(0, 6),
  };
}

export function getFilterTypeFromMovieType(movieType?: string) {
  if (!movieType) {
    return null;
  }

  const normalized = movieType.toLowerCase();

  if (normalized.includes('series')) {
    return 'phim-bo';
  }

  if (normalized.includes('single')) {
    return 'phim-le';
  }

  if (normalized.includes('hoathinh') || normalized.includes('anime')) {
    return 'hoat-hinh';
  }

  if (normalized.includes('tvshows') || normalized.includes('tv-shows')) {
    return 'tv-shows';
  }

  return null;
}

export async function getRelatedMovies(movieType: string, currentSlug: string) {
  const mappedType = getFilterTypeFromMovieType(movieType);

  if (!mappedType) {
    const latest = await apiClient.getLatestMovies(1, 3);
    return dedupeMoviesByFranchise(latest.items)
      .filter((movie) => movie.slug !== currentSlug)
      .slice(0, 18);
  }

  const response = await apiClient.getMoviesByFilter(mappedType, 1, 4);
  return dedupeMoviesByFranchise(response.items)
    .filter((movie) => movie.slug !== currentSlug)
    .slice(0, 18);
}
