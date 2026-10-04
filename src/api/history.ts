import { client } from './client'
import type { HistoryEntry } from '../types/auth'

export const historyApi = {
  record: (movie: { movieId: number; title: string; posterPath: string | null }) =>
    client.post<HistoryEntry>('/history', movie).then((r) => r.data),
  list: (limit = 24, offset = 0, signal?: AbortSignal) =>
    client.get<{ entries: HistoryEntry[]; total: number }>('/history', { params: { limit, offset }, signal }).then((r) => r.data),
  clear: () => client.delete<void>('/history'),
}
