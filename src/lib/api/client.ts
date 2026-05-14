import axios, { AxiosRequestConfig } from 'axios';
import { debugLogOnce } from '@/lib/debug';
import {
  ApiMovieLike,
  normalizeMovie,
  normalizeEpisodes,
  normalizeMovieDetail,
  resolveImageBase,
} from '@/lib/movie';
import { dedupeMovies, stripHtml } from '@/lib/utils';
import { MovieDetailResponse, MovieListResponse } from '@/types/movie';

const DEFAULT_TIMEOUT = 20000;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_LIST_LIMIT = 24;

type RequestParams = Record<string, string | number | undefined>;
type SourceKey = 'phimapi' | 'vsmov';

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

interface SourceRequest {
  endpoint: string;
  params?: RequestParams;
}

interface MovieSourceProfile {
  key: SourceKey;
  baseUrl: string;
  buildLatestRequest: (page: number) => SourceRequest;
  buildListRequest: (resolvedType: string, page: number, params: RequestParams) => SourceRequest;
  buildSearchRequest: (keyword: string, limit: number, page: number) => SourceRequest;
  buildDetailRequest: (slug: string) => SourceRequest;
}

const FILTER_TYPE_ALIASES: Record<string, string> = {
  'phim-bo': 'phim-bo',
  series: 'phim-bo',
  'phim-le': 'phim-le',
  single: 'phim-le',
  'hoat-hinh': 'hoat-hinh',
  anime: 'hoat-hinh',
  animation: 'hoat-hinh',
  'tv-shows': 'tv-shows',
  tvshows: 'tv-shows',
  'tv-show': 'tv-shows',
};

const SOURCE_PROFILES: ReadonlyArray<MovieSourceProfile> = [
  {
    key: 'phimapi',
    baseUrl: 'https://phimapi.com',
    buildLatestRequest: (page) => ({
      endpoint: '/danh-sach/phim-moi-cap-nhat',
      params: { page },
    }),
    buildListRequest: (resolvedType, page, params) => ({
      endpoint: `/v1/api/danh-sach/${resolvedType}`,
      params: {
        ...params,
        page,
      },
    }),
    buildSearchRequest: (keyword, limit, page) => ({
      endpoint: '/v1/api/tim-kiem',
      params: { keyword, limit, page },
    }),
    buildDetailRequest: (slug) => ({
      endpoint: `/phim/${slug}`,
    }),
  },
  {
    key: 'vsmov',
    baseUrl: 'https://vsmov.com',
    buildLatestRequest: (page) => ({
      endpoint: '/api/danh-sach/phim-moi-cap-nhat',
      params: { page },
    }),
    buildListRequest: (resolvedType, page, params) => {
      const requestParams: RequestParams = {
        ...params,
        page,
      };

      if (typeof requestParams.sort_field === 'string' && requestParams.sort_field.trim()) {
        requestParams.sort = requestParams.sort_field;
      }

      if (typeof requestParams.sort_lang === 'string' && requestParams.sort_lang.trim()) {
        requestParams.lang = requestParams.sort_lang;
      }

      delete requestParams.sort_field;
      delete requestParams.sort_type;
      delete requestParams.sort_lang;

      switch (resolvedType) {
        case 'phim-bo':
          requestParams.type = 'series';
          break;
        case 'phim-le':
          requestParams.type = 'single';
          break;
        case 'hoat-hinh':
          requestParams.type = 'single';
          if (typeof requestParams.category !== 'string' || !requestParams.category.trim()) {
            requestParams.category = 'hoat-hinh';
          }
          break;
        case 'tv-shows':
          requestParams.type = 'single';
          if (typeof requestParams.category !== 'string' || !requestParams.category.trim()) {
            requestParams.category = 'chuong-trinh-truyen-hinh';
          }
          break;
        default:
          requestParams.type = resolvedType;
          break;
      }

      return {
        endpoint: '/api/danh-sach',
        params: requestParams,
      };
    },
    buildSearchRequest: (keyword, limit, page) => ({
      endpoint: '/api/tim-kiem',
      params: { keyword, limit, page },
    }),
    buildDetailRequest: (slug) => ({
      endpoint: `/api/phim/${slug}`,
    }),
  },
];

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

  private async fetchFromSource<T>(
    source: MovieSourceProfile,
    request: SourceRequest,
    options: FetchOptions = {}
  ) {
    const params = this.sanitizeParams({
      ...(request.params || {}),
      ...(options.params || {}),
    });
    const cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    const cacheKey = `${source.key}:${this.buildCacheKey(request.endpoint, params)}`;
    const cached = this.getCached<T>(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await axios.get<T>(`${source.baseUrl}${request.endpoint}`, {
      ...options,
      params,
      proxy: false,
      timeout: options.timeout ?? DEFAULT_TIMEOUT,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.data) {
      throw new Error(`Empty payload from ${source.key}`);
    }

    this.setCached(cacheKey, response.data, cacheTtlMs);
    return response.data;
  }

  private async fetchFromAllSources<T>(
    requestBuilder: (source: MovieSourceProfile) => SourceRequest,
    options: FetchOptions = {}
  ) {
    const results = await Promise.allSettled(
      SOURCE_PROFILES.map(async (source) => ({
        source,
        payload: await this.fetchFromSource<T>(source, requestBuilder(source), options),
      }))
    );

    const successful: Array<{ source: MovieSourceProfile; payload: T }> = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      }
    }

    return successful;
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

  private resolveListType(type: string) {
    const normalizedType = type.trim().toLowerCase();
    return FILTER_TYPE_ALIASES[normalizedType] || normalizedType || 'phim-bo';
  }

  private normalizeListParams(extraParams: RequestParams = {}) {
    const params = this.sanitizeParams(extraParams);
    const normalized: RequestParams = { ...params };

    delete normalized.page;
    delete normalized.type;

    const explicitSortField =
      typeof params.sort_field === 'string' && params.sort_field.trim() ? params.sort_field.trim() : '';
    const sortField =
      explicitSortField ||
      (typeof params.sort === 'string' && params.sort.trim() ? params.sort.trim() : '');
    if (sortField) {
      normalized.sort_field = sortField;
      normalized.sort_type =
        typeof params.sort_type === 'string' && params.sort_type.trim() ? params.sort_type.trim() : 'desc';
    }

    const explicitSortLang =
      typeof params.sort_lang === 'string' && params.sort_lang.trim() ? params.sort_lang.trim() : '';
    const langValue = typeof params.lang === 'string' && params.lang.trim() ? params.lang.trim() : '';
    const sortLang = explicitSortLang || langValue;
    if (sortLang) {
      normalized.sort_lang = sortLang;
    }

    if (typeof normalized.limit !== 'number' && typeof normalized.limit !== 'string') {
      normalized.limit = DEFAULT_LIST_LIMIT;
    }

    delete normalized.sort;
    delete normalized.lang;

    return this.sanitizeParams(normalized);
  }

  private async fetchPaginatedListAcrossSources(
    requestBuilder: (source: MovieSourceProfile, page: number) => SourceRequest,
    page: number,
    fetchCount: number
  ): Promise<MovieListResponse> {
    const totalRequests = Math.max(1, Math.min(fetchCount || 1, 5));
    const pageNumbers = Array.from({ length: totalRequests }, (_, index) => page + index);
    const responsesByPage = await Promise.all(
      pageNumbers.map((targetPage) =>
        this.fetchFromAllSources<RawMovieListPayload>((source) => requestBuilder(source, targetPage))
      )
    );

    const normalizedResponses: MovieListResponse[] = [];

    responsesByPage.forEach((responses, pageIndex) => {
      const targetPage = pageNumbers[pageIndex];

      responses.forEach(({ source, payload }) => {
        const request = requestBuilder(source, targetPage);
        this.logPayloadShape(`${source.key}:${request.endpoint}:page-${targetPage}`, payload);
        normalizedResponses.push(this.normalizeMovieList(payload));
      });
    });

    if (!normalizedResponses.length) {
      throw new Error('Unable to fetch movies from any source');
    }

    const primary = normalizedResponses[0];
    const mergedItems = dedupeMovies(normalizedResponses.flatMap((response) => response.items));
    const totalPages = Math.max(...normalizedResponses.map((response) => response.pagination?.totalPages || 1));
    const totalItems = Math.max(...normalizedResponses.map((response) => response.pagination?.totalItems || 0));
    const perPage = Math.max(
      ...normalizedResponses.map((response) => response.pagination?.totalItemsPerPage || 0),
      DEFAULT_LIST_LIMIT
    );

    return {
      ...primary,
      status: true,
      items: mergedItems,
      pagination: {
        ...primary.pagination,
        totalItems: totalItems || mergedItems.length,
        totalItemsPerPage: perPage,
        totalPages,
        currentPage: page,
      },
    };
  }

  async getLatestMovies(page = 1, fetchCount = 1) {
    return this.fetchPaginatedListAcrossSources(
      (source, targetPage) => source.buildLatestRequest(targetPage),
      page,
      fetchCount
    );
  }

  async getMovieDetail(slug: string): Promise<MovieDetailResponse> {
    let lastError: unknown = null;

    for (const source of SOURCE_PROFILES) {
      try {
        const request = source.buildDetailRequest(slug);
        const response = await this.fetchFromSource<RawMovieDetailPayload>(source, request);
        this.logPayloadShape(`${source.key}:${request.endpoint}`, response);

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
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Unable to fetch movie detail from any source');
  }

  async getMoviesByFilter(
    type: string,
    page: number = 1,
    fetchCount: number = 1,
    extraParams: RequestParams = {}
  ) {
    const resolvedType = this.resolveListType(type);
    const normalizedParams = this.normalizeListParams(extraParams);

    return this.fetchPaginatedListAcrossSources(
      (source, targetPage) => source.buildListRequest(resolvedType, targetPage, normalizedParams),
      page,
      fetchCount
    );
  }

  async searchMovies(keyword: string, limit: number = 48, page: number = 1) {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) {
      return { status: true, items: [] } as MovieListResponse;
    }

    const responses = await this.fetchFromAllSources<RawMovieListPayload>(
      (source) => source.buildSearchRequest(trimmedKeyword, limit, page),
      {
        cacheTtlMs: 60 * 1000,
      }
    );

    if (!responses.length) {
      return { status: true, items: [] } as MovieListResponse;
    }

    const normalizedResponses = responses.map(({ source, payload }) => {
      const request = source.buildSearchRequest(trimmedKeyword, limit, page);
      this.logPayloadShape(`${source.key}:${request.endpoint}`, payload);
      return this.normalizeMovieList(payload);
    });

    const mergedItems = dedupeMovies(normalizedResponses.flatMap((response) => response.items));
    const totalPages = Math.max(...normalizedResponses.map((response) => response.pagination?.totalPages || 1));
    const totalItems = Math.max(...normalizedResponses.map((response) => response.pagination?.totalItems || 0));
    const totalItemsPerPage = Math.max(
      ...normalizedResponses.map((response) => response.pagination?.totalItemsPerPage || 0),
      limit
    );

    return {
      status: true,
      items: mergedItems,
      pagination: {
        totalItems: totalItems || mergedItems.length,
        totalPages,
        currentPage: page,
        totalItemsPerPage,
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
