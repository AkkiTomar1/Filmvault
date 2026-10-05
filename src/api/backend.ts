import axios from 'axios'
import type { UserProfile, SignupInput, LoginInput } from '../types/auth'
import type { Movie } from '../types/tmdb'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const backendClient = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface AuthResponse {
  success: boolean
  token?: string
  user?: UserProfile
  error?: string
}

export interface WatchlistResponse {
  success: boolean
  watchlist?: Movie[]
  movie?: Movie
  error?: string
}

export async function apiRegister(input: SignupInput): Promise<AuthResponse> {
  try {
    const res = await backendClient.post<AuthResponse>('/auth/register', input)
    return res.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      return { success: false, error: error.response.data.error }
    }
    return { success: false, error: 'Could not connect to backend server' }
  }
}

export async function apiLogin(input: LoginInput): Promise<AuthResponse> {
  try {
    const res = await backendClient.post<AuthResponse>('/auth/login', input)
    return res.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      return { success: false, error: error.response.data.error }
    }
    return { success: false, error: 'Could not connect to backend server' }
  }
}

export async function apiGetMe(token: string): Promise<AuthResponse> {
  try {
    const res = await backendClient.get<AuthResponse>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      return { success: false, error: error.response.data.error }
    }
    return { success: false, error: 'Could not fetch user profile from server' }
  }
}

export async function apiUpdateProfile(
  token: string,
  updates: Partial<Pick<UserProfile, 'name' | 'avatar' | 'bio' | 'preferredRegion'>>,
): Promise<AuthResponse> {
  try {
    const res = await backendClient.put<AuthResponse>('/profile', updates, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      return { success: false, error: error.response.data.error }
    }
    return { success: false, error: 'Could not update profile' }
  }
}

export async function apiGetWatchlist(token: string): Promise<WatchlistResponse> {
  try {
    const res = await backendClient.get<WatchlistResponse>('/watchlist', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      return { success: false, error: error.response.data.error }
    }
    return { success: false, error: 'Could not fetch watchlist from database' }
  }
}

export async function apiAddToWatchlist(token: string, movie: Movie): Promise<WatchlistResponse> {
  try {
    const res = await backendClient.post<WatchlistResponse>('/watchlist', movie, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      return { success: false, error: error.response.data.error }
    }
    return { success: false, error: 'Could not save movie to database' }
  }
}

export async function apiRemoveFromWatchlist(
  token: string,
  movieId: number,
): Promise<WatchlistResponse> {
  try {
    const res = await backendClient.delete<WatchlistResponse>(`/watchlist/${movieId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      return { success: false, error: error.response.data.error }
    }
    return { success: false, error: 'Could not delete movie from database' }
  }
}

export async function apiSyncWatchlist(
  token: string,
  movies: Movie[],
): Promise<WatchlistResponse> {
  try {
    const res = await backendClient.post<WatchlistResponse>(
      '/watchlist/sync',
      { movies },
      { headers: { Authorization: `Bearer ${token}` } },
    )
    return res.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      return { success: false, error: error.response.data.error }
    }
    return { success: false, error: 'Could not sync watchlist to database' }
  }
}
