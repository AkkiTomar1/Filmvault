import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  client,
  genreName,
  getDiscoverMovies,
  getGenres,
  getPopularMovies,
  getRandomMovie,
  getWatchProviders,
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

  it('fetches watch providers for the movie in the given region', async () => {
    mockedGet.mockResolvedValue({
      data: {
        id: 1,
        results: {
          US: {
            link: 'https://www.themoviedb.org/movie/1/watch',
            flatrate: [{ id: 8, name: 'Netflix', logo_path: '/netflix.svg' }],
          },
        },
      },
    } as never)

    const offer = await getWatchProviders(1, 'US')

    expect(mockedGet).toHaveBeenCalledWith(
      '/movie/1/watch/providers',
      expect.objectContaining({}),
    )
    expect(offer?.flatrate?.[0]?.name).toBe('Netflix')
  })

  it('returns null when the region is missing from watch providers', async () => {
    mockedGet.mockResolvedValue({
      data: { id: 1, results: { US: { link: 'x' } } },
    } as never)

    await expect(getWatchProviders(1, 'IN')).resolves.toBeNull()
  })

  it('builds discover query params for genres, decade and runtime', async () => {
    mockedGet.mockResolvedValue({ data: emptyResponse } as never)

    await getDiscoverMovies({
      genres: [28, 80],
      releaseFrom: '1990-01-01',
      releaseTo: '1999-12-31',
      maxRuntime: 120,
      minVotes: 200,
    })

    expect(mockedGet).toHaveBeenCalledWith(
      '/discover/movie',
      expect.objectContaining({
        params: expect.objectContaining({
          with_genres: '28,80',
          'primary_release_date.gte': '1990-01-01',
          'primary_release_date.lte': '1999-12-31',
          'with_runtime.lte': 120,
          'vote_count.gte': 200,
        }),
      }),
    )
  })

  it('picks a random movie from a discover page with a decent vote count', async () => {
    mockedGet.mockResolvedValue({
      data: {
        page: 1,
        results: [
          { id: 1, title: 'Alpha' },
          { id: 2, title: 'Beta' },
        ],
        total_pages: 2,
        total_results: 2,
      },
    } as never)

    const movie = await getRandomMovie()

    expect(['Alpha', 'Beta']).toContain(movie.title)
    expect(mockedGet).toHaveBeenCalledWith(
      '/discover/movie',
      expect.objectContaining({
        params: expect.objectContaining({ 'vote_count.gte': 500 }),
      }),
    )
  })
})