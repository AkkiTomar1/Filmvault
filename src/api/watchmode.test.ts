import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getEnabledRegions,
  getWatchmodeCatalog,
  getWatchmodeOffers,
  getWatchmodeSources,
  resetWatchmodeCatalogCache,
  resetWatchmodeRegionCache,
  resetWatchmodeTitleCache,
  watchmodeClient,
} from '../api/watchmode'

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

const mockedGet = vi.mocked(watchmodeClient.get)

const sourcesCatalog = [
  {
    id: 8,
    name: 'Netflix',
    logo_100px: 'https://cdn.watchmode.com/provider_logos/netflix_100px.png',
  },
  {
    id: 24,
    name: 'Amazon',
    logo_100px: 'https://cdn.watchmode.com/provider_logos/amazon_100px.png',
  },
  { id: 349, name: 'AppleTV', logo_100px: null },
  { id: 999, name: 'No Logo Provider', logo_100px: null },
]

const enabledRegions = [
  { country: 'US', name: 'United States', plan_enabled: true },
  { country: 'IN', name: 'India', plan_enabled: true },
  { country: 'GB', name: 'Great Britain', plan_enabled: true },
  { country: 'ZZ', name: 'Unsupported Land', plan_enabled: false },
]

const netflixSource = {
  source_id: 8,
  name: 'Netflix',
  type: 'sub',
  region: 'US',
  web_url: 'https://www.netflix.com/title/92082',
}

describe('watchmode api', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    resetWatchmodeCatalogCache()
    resetWatchmodeRegionCache()
    resetWatchmodeTitleCache()
  })

  it('builds a catalog of sources keyed by watchmode source id', async () => {
    mockedGet.mockResolvedValue({ data: sourcesCatalog } as never)

    const catalog = await getWatchmodeCatalog()

    expect(catalog.get(8)).toEqual({
      name: 'Netflix',
      logoUrl: 'https://cdn.watchmode.com/provider_logos/netflix_100px.png',
    })
    expect(catalog.get(349)).toEqual({ name: 'AppleTV', logoUrl: null })
    expect(mockedGet).toHaveBeenCalledWith('/sources/', expect.anything())
  })

  it('caches the source catalog across calls', async () => {
    mockedGet.mockResolvedValue({ data: sourcesCatalog } as never)

    await getWatchmodeCatalog()
    await getWatchmodeCatalog()

    expect(mockedGet).toHaveBeenCalledTimes(1)
  })

  it('returns only plan-enabled regions', async () => {
    mockedGet.mockResolvedValue({ data: enabledRegions } as never)

    const regions = await getEnabledRegions()

    expect(regions.has('US')).toBe(true)
    expect(regions.has('IN')).toBe(true)
    expect(regions.has('ZZ')).toBe(false)
  })

  it('caches the enabled regions list across calls', async () => {
    mockedGet.mockResolvedValue({ data: enabledRegions } as never)

    await getEnabledRegions()
    await getEnabledRegions()

    expect(mockedGet).toHaveBeenCalledTimes(1)
  })

  it('fetches title sources for a movie in the given region', async () => {
    mockedGet.mockResolvedValue({ data: [netflixSource] } as never)

    const sources = await getWatchmodeSources(92082, 'US')

    expect(mockedGet).toHaveBeenCalledWith(
      '/title/movie-92082/sources/',
      expect.objectContaining({ params: expect.objectContaining({ regions: 'US' }) }),
    )
    expect(sources[0].web_url).toBe('https://www.netflix.com/title/92082')
  })

  it('caches title sources within the ttl window', async () => {
    mockedGet.mockResolvedValue({ data: [] } as never)

    await getWatchmodeSources(1, 'US')
    await getWatchmodeSources(1, 'US')

    expect(mockedGet).toHaveBeenCalledTimes(1)
  })

  it('short-circuits to no offers when the region is not plan-enabled', async () => {
    mockedGet.mockResolvedValueOnce({ data: enabledRegions } as never)

    const offers = await getWatchmodeOffers(92082, 'DE')

    expect(offers).toEqual([])
    expect(mockedGet).toHaveBeenCalledTimes(1)
    expect(mockedGet).not.toHaveBeenCalledWith(
      '/title/movie-92082/sources/',
      expect.anything(),
    )
  })

  it('returns offers with logos, dropping sources without a web_url or region mismatch', async () => {
    mockedGet
      .mockResolvedValueOnce({ data: enabledRegions } as never)
      .mockResolvedValueOnce({ data: sourcesCatalog } as never)
      .mockResolvedValueOnce({
        data: [
          netflixSource,
          {
            source_id: 24,
            name: 'Amazon',
            type: 'rent',
            region: 'US',
            web_url: 'https://www.amazon.com/dp/B0TEST',
          },
          { source_id: 349, name: 'AppleTV', type: 'buy', region: 'US', web_url: 'https://tv.apple.com/us/movie/x' },
          { source_id: 999, name: 'No Logo Provider', type: 'sub', region: 'US', web_url: 'https://wat.ch/no-logo' },
          { ...netflixSource, source_id: 8 },
          { ...netflixSource, source_id: 500, region: 'IN' },
        ],
      } as never)

    const offers = await getWatchmodeOffers(92082, 'US')

    expect(offers).toEqual([
      {
        sourceId: 8,
        name: 'Netflix',
        type: 'sub',
        webUrl: 'https://www.netflix.com/title/92082',
        logoUrl: 'https://cdn.watchmode.com/provider_logos/netflix_100px.png',
      },
      {
        sourceId: 24,
        name: 'Amazon',
        type: 'rent',
        webUrl: 'https://www.amazon.com/dp/B0TEST',
        logoUrl: 'https://cdn.watchmode.com/provider_logos/amazon_100px.png',
      },
      {
        sourceId: 349,
        name: 'AppleTV',
        type: 'buy',
        webUrl: 'https://tv.apple.com/us/movie/x',
        logoUrl: null,
      },
      {
        sourceId: 999,
        name: 'No Logo Provider',
        type: 'sub',
        webUrl: 'https://wat.ch/no-logo',
        logoUrl: null,
      },
    ])
  })

  it('returns an empty array when the movie has no usable sources', async () => {
    mockedGet
      .mockResolvedValueOnce({ data: enabledRegions } as never)
      .mockResolvedValueOnce({ data: sourcesCatalog } as never)
      .mockResolvedValueOnce({ data: [] } as never)

    await expect(getWatchmodeOffers(92082, 'US')).resolves.toEqual([])
  })
})