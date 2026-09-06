# Routes

All routes are defined in `src/router.tsx` with `createHashRouter`. URLs are hash-based (`/#/movie/123`) because the app is served as a static bundle on GitHub Pages — no server rewrites are needed.

## Route table

| Path | Page | Navigation entry | Loader | Notes |
| --- | --- | --- | --- | --- |
| `/` | HomePage | Navbar → Home (brand/logo) | — | Shows trending hero banner + trending grid + pagination |
| `/watchlist` | WatchlistPage | Navbar → 🗂 Watchlist (count badge) | — | Filters, search, sort, delete; renders if watchlist empty |
| `/movie/:id` | MovieDetailsPage | Movie cards / search dropdown | ✅ `loader` | Fetches all data in parallel before render |
| `/search` | SearchResultsPage | Navbar live search (submit) | — | Reads `q` from URL search params |
| `/genre/:id` | GenreMoviesPage | Navbar → Genres dropdown, Footer genre links | — | Discover page per TMDB genre |
| `/movie-night` | MovieNightPage | Navbar → 🎲 Movie Night | — | 3-step generator + surprise me |
| `*` | `Navigate to "/"` | — | — | Catch-all redirect |

## Route definition shape

```ts
{
  path: '/movie/:id',
  element: <MovieDetailsPage />,
  loader: movieDetailsLoader,     // only detail page has one
  errorElement: <RouteError />,
}
```

Every page component is wrapped in `lazy(() => import('...').then(m => ({ Component: m.default })))`, so Vite emits one chunk per route. `RouteError` renders `ErrorState` with a Retry (full reload) + a "Back to home" link.

## Loader: `movieDetailsLoader`

`src/pages/MovieDetailsPage.tsx`

1. Read `params.id` → `Number`.
2. Fire five requests **in parallel** with one `AbortController` shared across them:
   - `getMovieDetails(id, signal)`
   - `getMovieCredits(id, signal)`
   - `getMovieVideos(id, signal)`
   - `getSimilarMovies(id, 1, signal)`
   - `getWatchProviders(id, detectRegion(), signal)`
3. On success, return `{ details, credits, videos, similar, providers }`.

If `details` is missing, the loader throws and the `errorElement` renders (covers unknown/removed IDs).

## Watchlist count & badges

The Navbar Watchlist link shows the live count via `useWatchlistContext().watchlist.length`. No extra route is involved.

## Search flow

- Navbar input is debounced (`useDebounce`, 300 ms) and hits `searchMovies`; the top 6 results render as a dropdown with thumbnails. Selecting a card navigates to `/movie/:id`; selecting the "See all results" row navigates to `/search?q=<query>`.
- `SearchResultsPage` re-runs `searchMovies` with the URL's `q` param and paginates results.

## Footer links

Footer genre section links to `/genre/:id` and the social icons are external anchors. TMDB attribution links back to themoviedb.org.