export interface MovieCategory {
  id: string;
  name: string;
  slug: string;
}

export interface MovieCountry {
  id: string;
  name: string;
  slug: string;
}

export interface MovieImageFields {
  title: string;
  poster: string;
  thumb: string;
  backdrop: string;
}

export interface MovieListItem extends MovieImageFields {
  name: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  slug: string;
  year: number;
  quality?: string;
  episode_current?: string;
  lang?: string;
  time?: string;
}

export interface MoviePagination {
  totalItems: number;
  totalItemsPerPage: number;
  currentPage: number;
  totalPages: number;
}

export interface MovieListResponse {
  status: boolean;
  items: MovieListItem[];
  pathImage?: string;
  pagination?: Partial<MoviePagination>;
}

export interface EpisodeServerData {
  name: string;
  slug: string;
  filename: string;
  link_m3u8: string;
  link_embed: string;
}

export interface Episode {
  server_name: string;
  server_data: EpisodeServerData[];
}

export interface MovieDetail {
  name: string;
  title: string;
  origin_name: string;
  content: string;
  type: string;
  status: string;
  thumb_url: string;
  poster_url: string;
  poster: string;
  thumb: string;
  backdrop: string;
  is_copyright: boolean;
  sub_docquyen: boolean;
  chieurap: boolean;
  trailer_url: string;
  time: string;
  episode_current: string;
  episode_total: string;
  quality: string;
  lang: string;
  notify: string;
  showtimes: string;
  slug: string;
  year: number;
  view: number;
  actor: string[];
  director: string[];
  category: MovieCategory[];
  country: MovieCountry[];
}

export interface MovieDetailResponse {
  status: boolean;
  movie: MovieDetail;
  episodes: Episode[];
}
