/**
 * Best-shot deep links for OTT providers, used as a fallback when Watchmode
 * has no data for the viewer's region. Each template is a search-style URL:
 * clicking it opens the platform and jumps to the movie's search result.
 */

const PROVIDER_URL_TEMPLATES: Record<string, string> = {
  netflix: 'https://www.netflix.com/search?q={query}',
  primevideo: 'https://www.primevideo.com/search?q={query}',
  amazonvideo: 'https://www.primevideo.com/search?q={query}',
  disney: 'https://www.disneyplus.com/search?q={query}',
  disneyplus: 'https://www.disneyplus.com/search?q={query}',
  appletv: 'https://tv.apple.com/search?q={query}',
  max: 'https://www.max.com/search?q={query}',
  hbomax: 'https://www.max.com/search?q={query}',
  hulu: 'https://www.hulu.com/search?q={query}',
  paramount: 'https://www.paramountplus.com/search?q={query}',
  paramountplus: 'https://www.paramountplus.com/search?q={query}',
  peacock: 'https://www.peacocktv.com/search?q={query}',
  youtube: 'https://www.youtube.com/results?search_query={query}',
  googleplay: 'https://play.google.com/store/search?q={query}&c=movies',
  crunchyroll: 'https://www.crunchyroll.com/search?q={query}',
}

// Short keys (e.g. 'max') are only honored as exact matches to avoid
// accidentally matching unrelated provider names via substring.
const SUBSTRING_MIN_KEY_LENGTH = 6

export function normalizeProviderName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function buildProviderUrl(providerName: string, movieTitle: string): string | null {
  if (!providerName || !movieTitle) return null
  const normalized = normalizeProviderName(providerName)
  const query = encodeURIComponent(movieTitle)

  let template = PROVIDER_URL_TEMPLATES[normalized]
  if (!template) {
    const match = Object.entries(PROVIDER_URL_TEMPLATES)
      .filter(
        ([key]) => key.length >= SUBSTRING_MIN_KEY_LENGTH && normalized.includes(key),
      )
      .sort((a, b) => b[0].length - a[0].length)[0]
    template = match?.[1]
  }

  return template ? template.replace('{query}', query) : null
}