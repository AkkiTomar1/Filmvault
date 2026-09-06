export interface Genre {
  id: number
  name: string
}

export interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  popularity: number
  genre_ids: number[]
  adult: boolean
  original_language: string
}

export interface MovieDetails extends Movie {
  tagline: string | null
  genres: Genre[]
  runtime: number | null
  status: string
  homepage: string | null
  budget: number
  revenue: number
}

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export interface Credits {
  id: number
  cast: CastMember[]
}

export interface Video {
  id: string
  key: string
  name: string
  site: string
  type: string
}

export interface Videos {
  id: number
  results: Video[]
}

export interface ApiResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export type SortKey = 'rating' | 'popularity' | 'release' | 'title'

export interface Provider {
  id: number
  name: string
  logo_path: string | null
  display_priorities?: Record<string, number>
}

export interface ProviderOffer {
  link?: string
  flatrate?: Provider[]
  rent?: Provider[]
  buy?: Provider[]
}

export interface WatchProvidersResponse {
  id: number
  results: Record<string, ProviderOffer | undefined>
}

export interface DiscoverParams {
  genres?: number[]
  releaseFrom?: string
  releaseTo?: string
  maxRuntime?: number
  minVotes?: number
  page?: number
}