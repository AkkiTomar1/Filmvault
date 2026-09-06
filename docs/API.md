# TMDB API, Watchmode API & Helpers

Everything in Filmvault talks to two external APIs through typed modules: **TMDB** (`src/api/tmdb.ts`) for catalogue/data and **Watchmode** (`src/api/watchmode.ts`) for per-platform streaming deeplinks. Image URLs and small formatting helpers live in `src/lib/`.

## TMDB client setup

```ts
const API_KEY = import.meta.env.VITE_TMDB_API_KEY   // required, loaded from .env
const BASE_URL = 'https://api.themoviedb.org/3'

export const client = axios.create({
  baseURL: BASE_URL,
  params: { api_key: API_KEY, language: 'en-US' },
})
```

- All endpoints are relative to `/3`.
- `language: 'en-US'` applies to catalogue requests (the watch-providers endpoint responds per-region, see `detectRegion`).
- Cancelled requests (from `AbortController`) are rethrown by the response interceptor so callers can ignore them with `axios.isCancel`.

## Endpoint reference

| Function | Endpoint | Key params | Returns |
| --- | --- | --- | --- |
| `getPopularMovies(page, signal?)` | `GET /movie/popular` | `page` | `ApiResponse<Movie>` |
| `searchMovies(query, page, signal?)` | `GET /search/movie` | `query`, `page`, `include_adult=false` | `ApiResponse<Movie>` |
| `getMovieDetails(movieId, signal?)` | `GET /movie/{id}` | — | `MovieDetails` (extends `Movie`) |
| `getMovieCredits(movieId, signal?)` | `GET /movie/{id}/credits` | — | `Credits` |
| `getMovieVideos(movieId, signal?)` | `GET /movie/{id}/videos` | — | `Videos` |
| `getSimilarMovies(movieId, page, signal?)` | `GET /movie/{id}/similar` | `page` | `ApiResponse<Movie>` |
| `getMoviesByGenre(genreId, page, signal?)` | `GET /discover/movie` | `with_genres`, `sort_by=popularity.desc`, `page` | `ApiResponse<Movie>` |
| `getTrending(page, signal?)` | `GET /trending/movie/week` | `page` | `ApiResponse<Movie>` |
| `getWatchProviders(movieId, region, signal?)` | `GET /movie/{id}/watch/providers` | — | `ProviderOffer \| null` |
| `getDiscoverMovies(params, signal?)` | `GET /discover/movie` | see below | `ApiResponse<Movie>` |
| `getRandomMovie(signal?)` | `GET /discover/movie` | random page, `vote_count.gte=500` | `Movie` |
| `getGenres(signal?)` | `GET /genre/movie/list` | — | `Promise<Genre[]>` *(cached)* |
| `genreName(genres, id)` | *(pure helper)* | — | `string \| undefined` |

### `getDiscoverMovies(params: DiscoverParams)`

Maps a typed object onto TMDB discover query params (dotted keys are used so axios serializes `with_runtime.lte=120`, not `with_runtime[lte]=120`):

| `DiscoverParams` | URL param |
| --- | --- |
| `genres: number[]` | `with_genres` (comma-joined) |
| `releaseFrom: 'YYYY-MM-DD'` | `primary_release_date.gte` |
| `releaseTo: 'YYYY-MM-DD'` | `primary_release_date.lte` |
| `maxRuntime: number` | `with_runtime.lte` |
| `minVotes: number` | `vote_count.gte` |
| `page: number` | `page` |

Always sends `sort_by=vote_count.desc` and `include_adult=false`. Used by the Movie Night Generator (mood x era x runtime).

### `getWatchProviders(movieId, region)`

Returns `res.data.results[region] ?? null`. A `null` result means "no streaming data for this region" (the page shows a friendly message). Shapes:

```ts
ProviderOffer { link?, flatrate?: Provider[], rent?: Provider[], buy?: Provider[] }
Provider      { provider_id, provider_name, logo_path, display_priority? }
```

> Field names match the TMDB wire format — watch/providers uses `provider_id`/`provider_name`, not `id`/`name`.

### Resilient client

The TMDB axios client retries idempotent GETs **once** (~400 ms later) on transient network failures (socket/TLS resets with no HTTP status), so the movie loader survives intermittent connectivity blips. HTTP errors (4xx/5xx) and aborted requests are never retried.

### Genre caching

`getGenres()` caches its result in a module-level variable so the Navbar, Footer, Watchlist page, and Movie Night page never re-fetch the list. `resetGenreCache()` is exported **for tests only**.

## Watchmode — `src/api/watchmode.ts`

Watchmode turns TMDB's provider logos into **real, per-platform deeplinks**. It's called with the TMDB movie id, so no IMDB id is needed.

```ts
const API_KEY = import.meta.env.VITE_WATCHMODE_API_KEY   // free tier, loaded from .env
const BASE_URL = 'https://api.watchmode.com/v1'

export const watchmodeClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'X-API-Key': API_KEY },   // required; ?apiKey= query auth is rejected (401)
})
```

| Function | Endpoint | Notes | Returns |
| --- | --- | --- | --- |
| `getWatchmodeCatalog(signal?)` | `GET /sources/` | Lists every platform with its id + logo. Module-level cache (like genres). The API does **not** expose TMDB provider ids, so this is used purely for logo/name lookup by Watchmode `source_id`. | `Map<sourceId, { name, logoUrl }>` |
| `getEnabledRegions(signal?)` | `GET /regions/` | Countries your plan supports. Module-level cache. The free plan only enables the 3 countries chosen at signup. | `Set<string>` |
| `getWatchmodeSources(tmdbId, region, signal?)` | `GET /title/movie-{id}/sources/` | `regions=US` filter. Per-title in-memory cache, 1h TTL. | `WatchmodeSource[]` |
| `getWatchmodeOffers(tmdbId, region, signal?)` | *(composes the above)* | Gate: if `region` isn't `plan_enabled`, returns `[]` **without calling `/title/.../sources/`** (Watchmode 400s on unenabled regions). Otherwise joins `/sources/` logos onto the title sources and keeps only entries with a `web_url` **and** a matching region, deduped by `source_id`. | `WatchmodeOffer[]` |

```ts
WatchmodeSource { source_id, name, type: 'sub' | 'rent' | 'buy' | 'free' | 'tve', region?, web_url? }
WatchmodeOffer { sourceId, name, type, webUrl, logoUrl }
```

**Credits:** the free Developer plan ≈ 1,000–2,500 requests/month. `GET /title/.../sources/` costs 2 credits, while `GET /sources/` and `GET /regions/` cost 1 each (both fetched once + cached). Each movie detail view = one title-sources call. Beyond the free tier Watchmode is paid, and free-plan data must be refreshed within 30 days.

**Region gate:** the free plan only enables the countries you chose at signup (up to 3). Because Watchmode rejects any other region with a `400`, `getWatchmodeOffers` first checks `getEnabledRegions` and skips the request (returning `[]`) when the viewer's locale country isn't enabled — so unsupported regions fall back to deep-linked TMDB OTT icons (`buildProviderUrl` in `src/lib/provider-links.ts`) and no bad requests are sent.

**Failure mode:** `MovieDetailsPage.loader` wraps the whole call in `.catch(() => [])`, so if the key is missing, the API is down, or the rate limit is hit, the Where to Watch section falls back to deep-linked TMDB OTT icons built from provider templates.

**Attribution:** Watchmode's free plan requires attribution; the page shows a small "Streaming links by Watchmode" line whenever offers are rendered.

## Types (`src/types/tmdb.ts`)

- Core: `Genre`, `Movie`, `MovieDetails`, `CastMember`, `Credits`, `Video`, `Videos`, `ApiResponse<T>`, `SortKey`.
- Discovery/streaming: `DiscoverParams`, `Provider`, `ProviderOffer`, `WatchProvidersResponse`.
- Watchmode: `WatchmodeSource`, `WatchmodeOffer` (`src/types/watchmode.ts`).

`MovieDetails` extends `Movie` with `tagline`, `genres`, `runtime`, `status`, `homepage`, `budget`, `revenue`.

## Media URLs — `src/lib/images.ts`

```ts
imageUrl(path, size = 'w500')   // → `https://image.tmdb.org/t/p/${size}${path}` or undefined for null path
```

Supported squares: `w45` (provider logos), `w92`, `w300`, `w500`, `w780`, `w1280`, `original`.

```ts
releaseYear(date)   // '2023-02-17' → '2023'; '' for missing
formatRating(value) // 8.1234 → '8.1'
```

## Region detection — `src/lib/region.ts`

```ts
detectRegion(language = navigator.language)  // → 2-letter region code, default 'US'
```

Scans the BCP-47 tag (starting at segment 1) for the last two-letter segment:

| Input | Result |
| --- | --- |
| `en-US` | `US` |
| `en-IN` | `IN` |
| `pt-BR` | `BR` |
| `zh-Hant-TW` | `TW` |
| `en` / `es` / `` | `US` (fallback) |

Used by the `MovieDetailsPage` loader to fetch region-specific watch providers.

When `VITE_WATCHMODE_REGION` is set to a valid 2-letter code, it wins over the
locale (uppercased, whitespace-trimmed); invalid values are ignored. Set it to
a plan-enabled region (e.g. `IN`) to render exact Watchmode `web_url` deeplinks
even when the browser locale's region isn't on the plan.

## Pagination — `src/lib/pagination.ts`

```ts
getPageNumbers(current, total): Array<number | 'ellipsis-start' | 'ellipsis-end'>
```

- `total <= 7` → returns every page.
- Otherwise: always includes `1` and `total`, plus the current page ± 1, with ellipsis markers for gaps.

| current | total | result |
| --- | --- | --- |
| 1 | 10 | `[1, 2, 3, …, 10]` |
| 5 | 10 | `[1, …, 4, 5, 6, …, 10]` |
| 10 | 10 | `[1, …, 8, 9, 10]` |

Inputs are clamped into `[1, total]`.