import axios from 'axios'
import type { WatchmodeOffer, WatchmodeSource } from '../types/watchmode'

const API_KEY: string | undefined = import.meta.env.VITE_WATCHMODE_API_KEY
const BASE_URL = 'https://api.watchmode.com/v1'

if (!API_KEY) {
  console.error(
    'VITE_WATCHMODE_API_KEY is not set. Copy .env.example to .env and add your Watchmode API key.',
  )
}

export const watchmodeClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'X-API-Key': API_KEY },
})

// Streaming sources catalog (Watchmode source id -> name/logo). Cached at the
// module level, like TMDB genres. Note: this endpoint does NOT expose TMDB
// provider ids, hence sources are matched to logos here and rendered directly.
let catalogCache: Map<number, { name: string; logoUrl: string | null }> | null = null

// Test helper: clears the module-level catalog cache between test cases.
export function resetWatchmodeCatalogCache(): void {
  catalogCache = null
}

export async function getWatchmodeCatalog(
  signal?: AbortSignal,
): Promise<Map<number, { name: string; logoUrl: string | null }>> {
  if (catalogCache) return catalogCache

  const res = await watchmodeClient.get<
    Array<{ id: number; name: string; logo_100px?: string | null }>
  >('/sources/', { signal })

  const catalog = new Map<number, { name: string; logoUrl: string | null }>()
  for (const source of res.data ?? []) {
    catalog.set(source.id, {
      name: source.name,
      logoUrl: source.logo_100px ?? null,
    })
  }
  catalogCache = catalog
  return catalog
}

let enabledRegionsCache: Set<string> | null = null

// Test helper: clears the module-level enabled-regions cache between test cases.
export function resetWatchmodeRegionCache(): void {
  enabledRegionsCache = null
}

/**
 * Countries the user's Watchmode plan has enabled (free Developer plan = up to
 * 3 chosen countries). Watchmode rejects any other region with a 400, so this
 * gate keeps those bad requests out. Cached at the module level.
 */
export async function getEnabledRegions(signal?: AbortSignal): Promise<Set<string>> {
  if (enabledRegionsCache) return enabledRegionsCache

  const res = await watchmodeClient.get<Array<{ country: string; plan_enabled?: boolean }>>(
    '/regions/',
    { signal },
  )

  const enabled = new Set<string>()
  for (const region of res.data ?? []) {
    if (region.plan_enabled !== false) enabled.add(region.country)
  }
  enabledRegionsCache = enabled
  return enabled
}

interface TitleSourcesCacheEntry {
  sources: WatchmodeSource[]
  expiresAt: number
}

const TITLE_SOURCES_TTL_MS = 60 * 60 * 1000
const titleSourcesCache = new Map<number, TitleSourcesCacheEntry>()

// Test helper: clears the per-title sources cache.
export function resetWatchmodeTitleCache(): void {
  titleSourcesCache.clear()
}

export async function getWatchmodeSources(
  tmdbId: number,
  region: string,
  signal?: AbortSignal,
): Promise<WatchmodeSource[]> {
  const cached = titleSourcesCache.get(tmdbId)
  if (cached && cached.expiresAt > Date.now()) return cached.sources

  const res = await watchmodeClient.get<WatchmodeSource[] | { sources?: WatchmodeSource[] }>(
    `/title/movie-${tmdbId}/sources/`,
    { params: { regions: region }, signal },
  )

  const sources = Array.isArray(res.data) ? res.data : res.data?.sources ?? []
  titleSourcesCache.set(tmdbId, { sources, expiresAt: Date.now() + TITLE_SOURCES_TTL_MS })
  return sources
}

/**
 * Positioned streaming offers for a movie in a region, each with its platform
 * deeplink (web_url) and logo. Best-effort: returns an empty array when
 * Watchmode data is missing, the region isn't enabled on the plan, or a call
 * fails, so the UI falls back to TMDB's label-only provider chips.
 */
export async function getWatchmodeOffers(
  tmdbId: number,
  region: string,
  signal?: AbortSignal,
): Promise<WatchmodeOffer[]> {
  const enabledRegions = await getEnabledRegions(signal)
  if (!enabledRegions.has(region.toUpperCase())) {
    return []
  }

  const [catalog, sources] = await Promise.all([
    getWatchmodeCatalog(signal),
    getWatchmodeSources(tmdbId, region, signal),
  ])

  const offers = new Map<number, WatchmodeOffer>()
  for (const source of sources) {
    if (!source.web_url) continue
    if (source.region && source.region.toUpperCase() !== region.toUpperCase()) continue
    if (offers.has(source.source_id)) continue
    offers.set(source.source_id, {
      sourceId: source.source_id,
      name: source.name,
      type: source.type,
      webUrl: source.web_url,
      logoUrl: catalog.get(source.source_id)?.logoUrl ?? null,
    })
  }
  return [...offers.values()]
}