import { client } from './client'
import type { WatchlistItem } from '../types/auth'

export const watchlistApi = {
  list: (signal?: AbortSignal) =>
    client.get<{ items: WatchlistItem[] }>('/watchlist', { signal }).then((r) => r.data.items),
  merge: (movies: Array<{ movieId: number; title: string; posterPath: string | null }>) =>
    client.post<{ items: WatchlistItem[] }>('/watchlist', { movies }).then((r) => r.data.items),
  remove: (movieId: number) => client.delete<void>(`/watchlist/${movieId}`),
  clear: () => client.delete<void>('/watchlist'),
}

