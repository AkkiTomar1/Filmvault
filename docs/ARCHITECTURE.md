# Architecture

This document explains how Filmvault is put together at a high level.

## Overview

Filmvault is a client-side-only React SPA. All movie data comes from the TMDB REST API through a thin typed Axios layer (`src/api/tmdb.ts`), and per-platform deeplinks come from the Watchmode API (`src/api/watchmode.ts`). User state (the watchlist and transient toasts) lives in React Context and is persisted to `localStorage`. Routing uses `createBrowserRouter` from react-router v7 with route-level code splitting (`lazy`) and data loading (`loader`).

Because it's a single static bundle deployed to GitHub Pages, there is **no backend, no account system, and no server-side rendering**.

## Boot sequence

`src/main.tsx`

```
StrictMode
 └─ ToastProvider            // transient toasts w/ undo action
     └─ WatchlistProvider    // watchlist in localStorage
         └─ RouterProvider   // createBrowserRouter (src/router.tsx)
```

Providers wrap the router so every route can call `useWatchlistContext()`, `useToast()`, and `useWatchlistToggle()`.

## Routing model

`src/router.tsx` defines one layout route (`/` → `Layout`) with children:

| Path           | Page (lazy)            | Loader | errorElement |
| -------------- | ---------------------- | ------ | ------------ |
| `/`            | HomePage               | —      | RouteError   |
| `/watchlist`   | WatchlistPage          | —      | RouteError   |
| `/movie/:id`   | MovieDetailsPage       | `loader` | RouteError   |
| `/search`      | SearchResultsPage      | —      | RouteError   |
| `/genre/:id`   | GenreMoviesPage        | —      | RouteError   |
| `/movie-night` | MovieNightPage         | —      | RouteError   |
| `*`            | `Navigate` → `/`       | —      | —            |

- `createBrowserRouter` is configured with `basename: import.meta.env.BASE_URL` (`/Filmvault/`), so routes are clean URLs like `/movie/123`. On static hosts the `dist/404.html` copy of `index.html` (emitted by the `spa-404-fallback` Vite plugin) handles deep-link refreshes.
- `*` redirects unknown paths back to `/`.
- Every page is imported with `lazy` → Vite code-splits each route into its own chunk.
- Only `MovieDetailsPage` uses `loader` (it fetches details + videos + credits + similar + watch providers in parallel before first paint).

`Layout` (`src/components/Layout.tsx`) renders the sticky `Navbar`, `<main>` with `<Outlet />`, and `Footer`, on a `bg-gray-100` page background.

## Data flow (pages → API)

1. A page mounts.
2. It calls one of the `get*` functions from `src/api/tmdb.ts` (optionally with an `AbortSignal` from a local `AbortController`).
3. The Axios client (pre-configured with `api_key` and `language: 'en-US'`) hits `https://api.themoviedb.org/3/...`.
4. `.then` updates component state; `.catch` sets an error state (cancelled requests are ignored via `axios.isCancel`).
5. Rendered output:
   - **loading** → `<LoadingSkeleton />`
   - **error** → `<ErrorState message onRetry />`
   - **success** → content.

### Race-safety pattern

The popular/search/genre pages use this exact shape so a stale response can never overwrite a newer one:

```ts
useEffect(() => {
  const controller = new AbortController()
  setLoading(true)
  getPopularMovies(page, controller.signal)
    .then(...)
    .catch((err) => { if (!axios.isCancel(err)) setError(true) })
    .finally(() => { if (!controller.signal.aborted) setLoading(false) })
  return () => controller.abort()   // unmount / dep-change aborts in-flight request
}, [page, reloadKey])
```

## Component tree

```
Layout
├─ Navbar
│  ├─ Brand (Logo img + wordmark)  → Link "/"
│  ├─ NavLinks: Home · Watchlist (count badge) · Movie Night
│  ├─ Genres dropdown (cached getGenres)
│  ├─ Surprise Me button (getRandomMovie → navigate)
│  └─ Live search (debounced searchMovies, top 6 dropdown)   → /search?q=
├─ <main> → <Outlet />
│  ├─ HomePage → Banner · MovieGrid · Pagination
│  ├─ SearchResultsPage → MovieGrid · Pagination
│  ├─ GenreMoviesPage → MovieGrid · Pagination
│  ├─ MovieDetailsPage → hero · overview · Where to Watch (OTT icons, linked) · trailer · cast · similar
│  ├─ MovieNightPage → 3-step picker · MovieGrid · re-roll
│  └─ WatchlistPage → filters · table
└─ Footer (brand · explore · genres · socials · TMDB attribution)
```

- `MovieGrid` renders `MovieCard` for each movie (used by Home, Search, Genre, Similar, and Movie Night).
- `MovieCard` shows poster, title overlay, rating badge, and a watchlist heart toggle.
- `Pagination` renders numbered pages with ellipsis (see `src/lib/pagination.ts`).

## Design conventions

- **Page chrome is light** (`bg-gray-100` via `Layout`).
- **Navbar and Footer are dark** with glassy translucent surfaces and gradient accents.
- **Movie surfaces** (posters, hero banner, banners) are dark so imagery pops.
- **The key exception:** `MovieNightPage` uses a white step panel with near-black text for maximum readability.
- Custom animations live in `src/index.css` (ken-burns, fade-up, film grain) and are all gated behind `prefers-reduced-motion: reduce`. See [STYLING.md](STYLING.md).

## Testing

Vitest config lives in `vite.config.js` (`environment: 'jsdom'`, `setupFiles: './src/test/setup.ts'`). Tests colocate beside their modules (`*.test.ts(x)`). See [TESTING.md](TESTING.md).