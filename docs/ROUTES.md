# Routes

All routes are defined in `src/router.tsx` with `createBrowserRouter`. URLs are clean paths (`/movie/123`) with `basename: import.meta.env.BASE_URL` (the `/Filmvault/` base in config). In-app navigation is fully client-side; a hard refresh on a deep link is caught by the `dist/404.html` fallback on static hosts.

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
2. Fire six requests **in parallel**:
   - `getMovieDetails(id, signal)`
   - `getMovieCredits(id, signal)`
   - `getMovieVideos(id, signal)`
   - `getSimilarMovies(id, 1, signal)`
   - `getWatchProviders(id, region, signal)` (TMDB OTT data — deep-link fallback)
   - `getWatchmodeOffers(id, region, signal)` — deeplinked offers per platform; wrapped in `.catch(() => [])` so Watchmode outages never break the page
3. `region` comes from `detectRegion()`: browser locale, or the `VITE_WATCHMODE_REGION` override when set.
4. On success, return `{ details, credits, videos, similar, providers, watchmodeOffers, region }`.

The Where to Watch section renders a single wrapping row of OTT (subscription/free) provider icons, each deeplinked to that movie on the platform. Watchmode offers provide exact links where the plan allows; otherwise TMDB `providers.flatrate` icons are deep-linked via `buildProviderUrl` (built-in provider templates) and any platform without a link is skipped. Rent/buy platforms are not shown.

If `details` is missing, the loader throws and the `errorElement` renders (covers unknown/removed IDs).

## Watchlist count & badges

The Navbar Watchlist link shows the live count via `useWatchlistContext().watchlist.length`. No extra route is involved.

## Search flow

- Navbar input is debounced (`useDebounce`, 300 ms) and hits `searchMovies`; the top 6 results render as a dropdown with thumbnails. Selecting a card navigates to `/movie/:id`; selecting the "See all results" row navigates to `/search?q=<query>`.
- `SearchResultsPage` re-runs `searchMovies` with the URL's `q` param and paginates results.

## Footer links

Footer genre section links to `/genre/:id` and the social icons are external anchors. TMDB attribution links back to themoviedb.org.