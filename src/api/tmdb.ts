import axios from 'axios'
import type {
  ApiResponse,
  Credits,
  Genre,
  Movie,
  MovieDetails,
  Videos,
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