import { client } from './client'
import type { HistoryEntry } from '../types/auth'

export const historyApi = {
  record: (movie: { movieId: number; title: string; posterPath: string | null }) =>
    client.post<HistoryEntry>('/history', movie).then((r) => r.data),
}
