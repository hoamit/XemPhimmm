import axios, { AxiosRequestConfig } from 'axios';
import { debugLogOnce } from '@/lib/debug';
import {
  ApiMovieLike,
  normalizeEpisodes,
  normalizeMovie,
  normalizeMovieDetail,
  resolveImageBase,
} from '@/lib/movie';
import { dedupeMovies, stripHtml } from '@/lib/utils';
import { MovieDetailResponse, MovieListResponse } from '@/types/movie';

const SOURCES = [
  'https://phimapi.com',
  'https://ophim1.com',
  'https://kkphim.com',
] as const;

const DEFAULT_TIMEOUT = 20000;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

type RequestParams = Record<string, string | number | undefined>;

interface FetchOptions extends Omit<AxiosRequestConfig, 'baseURL' | 'url' | 'params'> {
  params?: RequestParams;
  cacheTtlMs?: number;
}

interface RawMovieListPayload {
  status?: boolean | string;
  items?: ApiMovieLike[];
  pagination?: MovieListResponse['pagination'];
  domain_image?: string;
  APP_DOMAIN_CDN_IMAGE?: string;
  pathImage?: string;
  params?: {
    pagination?: MovieListResponse['pagination'];
  };
  data?: RawMovieListPayload;
}

interface RawMovieDetailPayload {
  status?: boolean | string;
  movie?: ApiMovieLike;
  episodes?: unknown;
  domain_image?: string;
  APP_DOMAIN_CDN_IMAGE?: string;
  pathImage?: string;
  data?: RawMovieDetailPayload;
}

class ApiClient {
  private responseCache = new Map<string, { expiresAt: number; data: unknown }>();

  private sanitizeParams(params: RequestParams = {}) {
    return Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
  }

  private buildCacheKey(endpoint: string, params: RequestParams = {}) {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(this.sanitizeParams(params))) {
      searchParams.set(key, String(value));
    }

    const query = searchParams.toString();
    return query ? `${endpoint}?${query}` : endpoint;
  }

  private getCached<T>(cacheKey: string) {
    const cached = this.responseCache.get(cacheKey);
    if (!cached) {
      return null;
    }

    if (cached.expiresAt < Date.now()) {
      this.responseCache.delete(cacheKey);
      return null;
    }

    return cached.data as T;
  }

  private setCached(cacheKey: string, data: unknown, ttlMs: number) {
    this.responseCache.set(cacheKey, {
      expiresAt: Date.now() + ttlMs,
      data,
    });
  }

  private logPayloadShape(label: string, payload: unknown) {
    if (!payload || typeof payload !== 'object') {
      return;
    }

    const rawPayload = payload as Record<string, unknown>;
    const nestedPayload =
      rawPayload.data && typeof rawPayload.data === 'object'
        ? (rawPayload.data as Record<string, unknown>)
        : rawPayload;
    const items = Array.isArray(nestedPayload.items) ? nestedPayload.items : [];
    const sampleItem = items.find((item) => item && typeof item === 'object') as
      | Record<string, unknown>
      | undefined;

    debugLogOnce(`api:${label}`, `[api] ${label} response shape`, {
      rootKeys: Object.keys(rawPayload),
      payloadKeys: Object.keys(nestedPayload),
      itemKeys: sampleItem ? Object.keys(sampleItem) : [],
      itemCount: items.length,
    });
  }

  private async fetchWithFallback<T>(endpoint: string, options: FetchOptions = {}) {
    const params = this.sanitizeParams(options.params);
    const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    const cacheKey = this.buildCacheKey(endpoint, params);
    const cached = this.getCached<T>(cacheKey);

    if (cached) {
      return cached;
    }

    let lastError: unknown = null;

    for (const baseUrl of SOURCES) {
      try {
        const response = await axios.get<T>(`${baseUrl}${endpoint}`, {
          ...options,
          params,
          proxy: false,
          timeout: options.timeout ?? DEFAULT_TIMEOUT,
          headers: {
            Accept: 'application/json',
            ...(options.headers || {}),
          },
        });

        if (response.data) {
          this.setCached(cacheKey, response.data, cacheTtlMs);
          return response.data;
        }
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('All movie sources failed');
  }

  private normalizeMovieList(response?: RawMovieListPayload | null): MovieListResponse {
    const payload = response?.data || response || {};
    const items = Array.isArray(payload.items) ? payload.items : [];
    const imageBase = resolveImageBase(
      payload.domain_image,
      payload.APP_DOMAIN_CDN_IMAGE,
      payload.pathImage
    );

    const rawPagination = (
      payload.pagination ||
      payload.params?.pagination ||
      {}
    ) as Record<string, string | number | undefined>;

    const normalizedItems = dedupeMovies(
      items
        .map((item) => normalizeMovie(item, imageBase))
        .filter((movie) => Boolean(movie.slug) && stripHtml(movie.title).length > 0)
    );

    return {
      status: Boolean(payload.status ?? true),
      pathImage: imageBase,
      pagination: {
        totalItems: Number(rawPagination.totalItems || rawPagination.total_items || normalizedItems.length),
        totalItemsPerPage: Number(
          rawPagination.totalItemsPerPage || rawPagination.total_items_per_page || normalizedItems.length
        ),
        currentPage: Number(rawPagination.currentPage || rawPagination.current_page || 1),
        totalPages: Number(rawPagination.totalPages || rawPagination.total_pages || 1),
      },
      items: normalizedItems,
    };
  }

  private async fetchPaginatedList(
    endpoint: string,
    page: number,
    _fetchCount: number,
    extraParams: RequestParams = {}
  ): Promise<MovieListResponse> {
    const results = await Promise.allSettled(
      SOURCES.map((baseUrl) =>
        axios.get<RawMovieListPayload>(`${baseUrl}${endpoint}`, {
          params: this.sanitizeParams({ page, ...extraParams }),
          proxy: false,
          timeout: DEFAULT_TIMEOUT,
          headers: { Accept: 'application/json' },
        })
      )
    );

    const successful = results
      .filter(
        (result): result is PromiseFulfilledResult<import('axios').AxiosResponse<RawMovieListPayload>> =>
          result.status === 'fulfilled'
      )
      .map((result, index) => {
        this.logPayloadShape(`${endpoint}:${index}`, result.value.data);
        return this.normalizeMovieList(result.value.data);
      });

    if (successful.length === 0) {
      throw new Error('Unable to fetch movies from any source');
    }

    const primary = successful[0];
    const allItems = successful.flatMap((result) => result.items);
    const totalItems = successful.reduce((acc, result) => acc + (result.pagination?.totalItems || 0), 0);
    const totalPages = Math.max(...successful.map((result) => result.pagination?.totalPages || 0));

    return {
      ...primary,
      items: dedupeMovies(allItems),
      pagination: {
        ...primary.pagination,
        totalItems,
        totalPages,
        currentPage: page,
      },
    };
  }

  private async fetchFromAllSources<T>(endpoint: string, options: FetchOptions = {}) {
    const results = await Promise.allSettled(
      SOURCES.map((baseUrl) =>
        axios.get<T>(`${baseUrl}${endpoint}`, {
          ...options,
          params: this.sanitizeParams(options.params),
          proxy: false,
          timeout: options.timeout ?? DEFAULT_TIMEOUT,
          headers: {
            Accept: 'application/json',
            ...(options.headers || {}),
          },
        })
      )
    );

    return results
      .filter((result): result is PromiseFulfilledResult<import('axios').AxiosResponse<T>> => result.status === 'fulfilled')
      .map((result) => result.value.data);
  }

  async getLatestMovies(page = 1, fetchCount = 1) {
    return this.fetchPaginatedList('/danh-sach/phim-moi-cap-nhat', page, fetchCount);
  }

  async getMovieDetail(slug: string): Promise<MovieDetailResponse> {
    const response = await this.fetchWithFallback<RawMovieDetailPayload>(`/phim/${slug}`);
    this.logPayloadShape(`/phim/${slug}`, response);

    const payload = response.data || response || {};
    const imageBase = resolveImageBase(
      payload.domain_image,
      payload.APP_DOMAIN_CDN_IMAGE,
      payload.pathImage
    );

    return {
      status: Boolean(payload.status ?? true),
      movie: normalizeMovieDetail(payload.movie || {}, imageBase),
      episodes: normalizeEpisodes(payload.episodes),
    };
  }

  async getMoviesByFilter(
    type: string,
    page: number = 1,
    fetchCount: number = 1,
    extraParams: RequestParams = {}
  ) {
    return this.fetchPaginatedList(`/v1/api/danh-sach/${type}`, page, fetchCount, extraParams);
  }

  async searchMovies(keyword: string, limit: number = 48, page: number = 1) {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) {
      return { status: true, items: [] } as MovieListResponse;
    }

    const payloads = await this.fetchFromAllSources<RawMovieListPayload>('/v1/api/tim-kiem', {
      params: { keyword: trimmedKeyword, limit, page },
      cacheTtlMs: 60 * 1000,
    });

    if (payloads.length === 0) {
      return { status: true, items: [] } as MovieListResponse;
    }

    payloads.forEach((payload, index) => this.logPayloadShape(`/v1/api/tim-kiem:${index}`, payload));

    const responses = payloads.map((payload) => this.normalizeMovieList(payload));
    const mergedItems = dedupeMovies(responses.flatMap((response) => response.items));
    const totalItems = responses.reduce((acc, response) => acc + (response.pagination?.totalItems || 0), 0);
    const totalPages = Math.max(...responses.map((response) => response.pagination?.totalPages || 0));

    return {
      status: true,
      items: mergedItems,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        totalItemsPerPage: limit,
      },
    } as MovieListResponse;
  }

  async getMergedCollections(collections: Array<{ type: string; page?: number; fetchCount?: number }>) {
    const results = await Promise.allSettled(
      collections.map(({ type, page = 1, fetchCount = 1 }) => this.getMoviesByFilter(type, page, fetchCount))
    );

    return dedupeMovies(
      results
        .filter((result): result is PromiseFulfilledResult<MovieListResponse> => result.status === 'fulfilled')
        .flatMap((result) => result.value.items)
    );
  }
}

export const apiClient = new ApiClient();
