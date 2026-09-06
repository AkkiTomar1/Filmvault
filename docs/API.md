# TMDB API & Helpers

Everything in Filmvault talks to The Movie Database (TMDB) through one typed module: `src/api/tmdb.ts`. Image URLs and small formatting helpers live in `src/lib/`.

## Client setup

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

Returns `res.data.results[region] ?? null`. A `null` result means "no streaming data for this region" (the page shows a friendly message + TMDB watch link). Shapes:

```ts
ProviderOffer { link?, flatrate?: Provider[], rent?: Provider[], buy?: Provider[] }
Provider      { id, name, logo_path, display_priorities? }
```

### Genre caching

`getGenres()` caches its result in a module-level variable so the Navbar, Footer, Watchlist page, and Movie Night page never re-fetch the list. `resetGenreCache()` is exported **for tests only**.

## Types (`src/types/tmdb.ts`)

- Core: `Genre`, `Movie`, `MovieDetails`, `CastMember`, `Credits`, `Video`, `Videos`, `ApiResponse<T>`, `SortKey`.
- Discovery/streaming: `DiscoverParams`, `Provider`, `ProviderOffer`, `WatchProvidersResponse`.

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