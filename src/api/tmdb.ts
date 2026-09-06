import axios from 'axios'
import type {
  ApiResponse,
  Credits,
  DiscoverParams,
  Genre,
  Movie,
  MovieDetails,
  ProviderOffer,
  Videos,
  WatchProvidersResponse,
} from '../types/tmdb'

const API_KEY: string | undefined = import.meta.env.VITE_TMDB_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'

if (!API_KEY) {
  console.error(
    'VITE_TMDB_API_KEY is not set. Copy .env.example to .env and add your TMDB API key.',
  )
}

export const client = axios.create({
  baseURL: BASE_URL,
  params: { api_key: API_KEY, language: 'en-US' },
})

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error)
    }
    return Promise.reject(error)
  },
)

export function getPopularMovies(page = 1, signal?: AbortSignal) {
  return client
    .get<ApiResponse<Movie>>('/movie/popular', { params: { page }, signal })
    .then((res) => res.data)
}

export function searchMovies(query: string, page = 1, signal?: AbortSignal) {
  return client
    .get<ApiResponse<Movie>>('/search/movie', {
      params: { query, page, include_adult: false },
      signal,
    })
    .then((res) => res.data)
}

export function getMovieDetails(movieId: number, signal?: AbortSignal) {
  return client
    .get<MovieDetails>(`/movie/${movieId}`, { signal })
    .then((res) => res.data)
}

export function getMovieCredits(movieId: number, signal?: AbortSignal) {
  return client
    .get<Credits>(`/movie/${movieId}/credits`, { signal })
    .then((res) => res.data)
}

export function getMovieVideos(movieId: number, signal?: AbortSignal) {
  return client
    .get<Videos>(`/movie/${movieId}/videos`, { signal })
    .then((res) => res.data)
}

export function getSimilarMovies(movieId: number, page = 1, signal?: AbortSignal) {
  return client
    .get<ApiResponse<Movie>>(`/movie/${movieId}/similar`, {
      params: { page },
      signal,
    })
    .then((res) => res.data)
}

export function getMoviesByGenre(genreId: number, page = 1, signal?: AbortSignal) {
  return client
    .get<ApiResponse<Movie>>('/discover/movie', {
      params: { with_genres: genreId, sort_by: 'popularity.desc', page },
      signal,
    })
    .then((res) => res.data)
}

export function getTrending(page = 1, signal?: AbortSignal) {
  return client
    .get<ApiResponse<Movie>>('/trending/movie/week', {
      params: { page },
      signal,
    })
    .then((res) => res.data)
}

export function getWatchProviders(
  movieId: number,
  region: string,
  signal?: AbortSignal,
): Promise<ProviderOffer | null> {
  return client
    .get<WatchProvidersResponse>(`/movie/${movieId}/watch/providers`, { signal })
    .then((res) => res.data.results?.[region] ?? null)
}

export function getDiscoverMovies(params: DiscoverParams, signal?: AbortSignal) {
  const query: Record<string, string | number | boolean> = {
    sort_by: 'vote_count.desc',
    include_adult: false,
  }
  if (params.genres && params.genres.length > 0) {
    query.with_genres = params.genres.join(',')
  }
  if (params.releaseFrom) query['primary_release_date.gte'] = params.releaseFrom
  if (params.releaseTo) query['primary_release_date.lte'] = params.releaseTo
  if (params.maxRuntime) query['with_runtime.lte'] = params.maxRuntime
  if (params.minVotes) query['vote_count.gte'] = params.minVotes
  if (params.page) query.page = params.page

  return client
    .get<ApiResponse<Movie>>('/discover/movie', { params: query, signal })
    .then((res) => res.data)
}

export async function getRandomMovie(signal?: AbortSignal): Promise<Movie> {
  const page = Math.floor(Math.random() * 500) + 1
  const res = await client.get<ApiResponse<Movie>>('/discover/movie', {
    params: {
      sort_by: 'vote_count.desc',
      'vote_count.gte': 500,
      page,
      include_adult: false,
    },
    signal,
  })
  const results = res.data.results ?? []
  const pick = results[Math.floor(Math.random() * results.length)]
  if (!pick) {
    throw new Error('Could not find a random movie.')
  }
  return pick
}

let genreCache: Genre[] | null = null

// Test helper: clears the module-level genre cache between test cases.
export function resetGenreCache(): void {
  genreCache = null
}

export async function getGenres(signal?: AbortSignal): Promise<Genre[]> {
  if (genreCache) return genreCache
  const res = await client.get<{ genres?: Genre[] }>('/genre/movie/list', { signal })
  genreCache = res.data.genres ?? []
  return genreCache
}

export function genreName(genres: Genre[], id: number): string | undefined {
  return genres.find((genre) => genre.id === id)?.name
}