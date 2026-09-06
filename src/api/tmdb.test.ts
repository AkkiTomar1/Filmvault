import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  client,
  genreName,
  getGenres,
  getPopularMovies,
  resetGenreCache,
  searchMovies,
} from '../api/tmdb'

vi.mock('axios', () => {
  const get = vi.fn()
  return {
    default: {
      create: () => ({
        get,
        interceptors: { response: { use: vi.fn() } },
      }),
      isCancel: vi.fn(() => false),
    },
  }
})

const mockedGet = vi.mocked(client.get)

const emptyResponse = {
  page: 1,
  results: [],
  total_pages: 1,
  total_results: 0,
}

describe('tmdb api', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    resetGenreCache()
  })

  it('fetches popular movies for a page', async () => {
    mockedGet.mockResolvedValue({ data: emptyResponse } as never)

    const data = await getPopularMovies(1)

    expect(mockedGet).toHaveBeenCalledWith(
      '/movie/popular',
      expect.objectContaining({
        params: expect.objectContaining({ page: 1 }),
      }),
    )
    expect(data.results).toEqual([])
  })

  it('forwards the abort signal and query to search', async () => {
    const signal = new AbortController().signal
    mockedGet.mockResolvedValue({ data: emptyResponse } as never)

    await searchMovies('matrix', 2, signal)

    expect(mockedGet).toHaveBeenCalledWith(
      '/search/movie',
      expect.objectContaining({
        signal,
        params: expect.objectContaining({ query: 'matrix', page: 2 }),
      }),
    )
  })

  it('caches the genre list across calls', async () => {
    mockedGet.mockResolvedValue({ data: { genres: [{ id: 28, name: 'Action' }] } } as never)

    const first = await getGenres()
    const second = await getGenres()

    expect(first).toEqual([{ id: 28, name: 'Action' }])
    expect(second).toEqual(first)
    expect(mockedGet).toHaveBeenCalledTimes(1)
  })

  it('resolves an empty list when the response lacks a genres array (never undefined)', async () => {
    mockedGet.mockResolvedValue({ data: { error: 'some error', status_code: 7 } } as never)

    const genres = await getGenres()

    expect(genres).toEqual([])
    expect(genres).toBeInstanceOf(Array)
  })

  it('maps a genre id to its name via genreName', () => {
    const genres = [
      { id: 28, name: 'Action' },
      { id: 80, name: 'Crime' },
    ]
    expect(genreName(genres, 80)).toBe('Crime')
    expect(genreName(genres, 999)).toBeUndefined()
    expect(genreName([], 28)).toBeUndefined()
  })
})