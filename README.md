# 🎬 Filmvault

Discover trending movies, find **where to watch them**, and build your personal watchlist — or let Filmvault plan your movie night for you. Built with **React 19**, **Vite 7**, **Tailwind CSS v4**, and strict **TypeScript**, powered by the [TMDB API](https://www.themoviedb.org).

> **Why Filmvault?** Most movie sites are catalogs. Filmvault is a *tool*: it tells you where a movie is streaming in your country, generates a shortlist for movie night in three clicks, and surprise-picks a well-rated movie when you can't decide. No account, no tracking — everything is stored locally in your browser.

---

## ✨ Features

- 🏠 **Cinematic trending hero** — the #1 trending movie of the week with Ken Burns zoom, film grain, genre chips, live rating/year, a watchlist toggle, and a floating poster card on desktop.
- 🎬 **Trending movie grid** — responsive edge-to-edge grid (2–6 columns) with a modern numbered + ellipsis pagination bar.
- 🔍 **Live navbar search** — debounced, race-safe search-as-you-type with poster thumbnails that jumps to the full search page.
- 🎥 **Movie detail pages** — overview, runtime, genres, rating bar, cast, YouTube trailer, and similar movies.
- 📺 **Where to Watch** — a row of streaming/OTT provider icons (Netflix, Prime Video, Disney+…) for your detected region, each icon deep-linked to that movie on the platform; Watchmode provides exact links where the plan allows, and other regions/platforms fall back to built-in provider search links.
- 🎲 **Movie Night Generator** (`/movie-night`) — pick a mood (genres), an era (80s → 20s), and a length, and get **5 shuffled picks** you can re-roll instantly.
- 🃏 **Surprise Me** — one click (navbar or generator) sends you to a random, highly-voted movie.
- 🗂️ **Watchlist** — persisted to `localStorage` with **working** genre filters, search, sorting, real genre names, per-row delete, and clear-all — all with **Undo** toasts.
- 🔖 **Genre browsing** — every TMDB genre with its own paginated discovery page.
- 🖼️ Smart loading skeletons, graceful error states with retry, fallback images, lazy-loaded routes, and `AbortController`-safe fetches.

## 🧑‍💻 Getting Started

### Prerequisites

- **Node.js 20+** (CI uses v20)
- A free [TMDB API key](https://www.themoviedb.org/settings/api)
- A free [Watchmode API key](https://www.watchmode.com) (powers per-platform streaming links)

### Setup

```bash
npm install
cp .env.example .env   # then paste your real API key into .env
npm run dev            # http://localhost:5173
```

> **Environment variables** (`.env`): `VITE_TMDB_API_KEY` and `VITE_WATCHMODE_API_KEY` (plus the optional `VITE_WATCHMODE_REGION` to force the streaming region). Never commit real keys — `.env` is gitignored. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for CI setup.

## 📜 Scripts

| Command               | Description                                        |
| --------------------- | -------------------------------------------------- |
| `npm run dev`         | Start the Vite dev server (HMR)                   |
| `npm run build`       | Type-check (`tsc`) then produce a production build |
| `npm run typecheck`   | Run the TypeScript type checker                    |
| `npm run lint`        | ESLint (JS/TS + React hooks + react-refresh)       |
| `npm test`            | Run the Vitest suite once                          |
| `npm run test:watch`  | Run Vitest in watch mode                           |
| `npm run preview`     | Preview the production build locally               |
| `npm run deploy`      | Build then publish `dist/` to GitHub Pages         |

## 🛠 Tech Stack

| Layer        | Choice                                                        |
| ------------ | ------------------------------------------------------------- |
| UI           | React 19 + **react-router-dom v7** (`createBrowserRouter`, `lazy`, `loader`) |
| Build        | Vite 7 (`@vitejs/plugin-react`) + `@tailwindcss/vite`          |
| Styling      | Tailwind CSS v4 (utility-first, custom keyframes)              |
| HTTP         | Axios (typed TMDB + Watchmode clients)                            |
| Icons        | `react-icons` (Font Awesome 6)                                 |
| Language     | TypeScript (strict: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) |
| Testing      | Vitest + React Testing Library + jsdom                         |
| Deployment   | GitHub Pages via GitHub Actions + `gh-pages`                   |

## 📁 Project Structure

```
Filmvault/
├── .github/workflows/deploy.yml   # CI: lint → test → build → deploy
├── docs/                          # Project documentation
│   ├── ARCHITECTURE.md            # App flow, data layer, component tree
│   ├── API.md                     # Every TMDB endpoint + helpers
│   ├── ROUTES.md                  # Route map
│   ├── STATE.md                   # Watchlist & toast state
│   ├── STYLING.md                 # Tailwind, keyframes, design conventions
│   ├── TESTING.md                 # Test setup & patterns
│   └── DEPLOYMENT.md              # HashRouter, base path, env secrets
├── src/
│   ├── api/tmdb.ts                 # Typed TMDB API layer (axios client)
│   ├── api/watchmode.ts            # Watchmode streaming-source links (axios client)
│   ├── assets/                    # Static images (logo/fallback)
│   ├── components/                # Navbar, Footer, Banner, MovieCard, MovieGrid,
│   │                              # Pagination, LoadingSkeleton, ErrorState, Layout, …
│   ├── context/                   # WatchlistContext, ToastContext
│   ├── hooks/                     # useWatchlist, useWatchlistToggle, useDebounce
│   ├── lib/                       # images, region, pagination helpers
│   ├── pages/                     # Home, Search, Details, Watchlist, Genre, Movie Night
│   ├── test/setup.ts              # Vitest setup
│   └── types/tmdb.ts              # TMDB models + app types
│   └── types/watchmode.ts         # Watchmode streaming-source types
├── index.html                     # SPA shell + meta tags
├── vite.config.js                 # Vite + Vitest config (`base: '/Filmvault/'`)
└── tsconfig.json
```

## 🔐 CI / Deployment

`.github/workflows/deploy.yml` runs on every push to `main`:

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `npm run build` (with `VITE_TMDB_API_KEY` + `VITE_WATCHMODE_API_KEY` injected from the `TMDB_API_KEY` and `WATCHMODE_API_KEY` repo secrets)
5. Publish `dist/` to GitHub Pages

To deploy, add repo secrets named `TMDB_API_KEY` and `WATCHMODE_API_KEY` with your keys, then push to `main`. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## 📚 Docs

- [Architecture](docs/ARCHITECTURE.md)
- [TMDB API & helpers](docs/API.md)
- [Routes](docs/ROUTES.md)
- [State management](docs/STATE.md)
- [Styling](docs/STYLING.md)
- [Testing](docs/TESTING.md)
- [Deployment](docs/DEPLOYMENT.md)

## ⚖️ Attribution

Filmvault uses the TMDB API but is not endorsed or certified by TMDB. Attribution is shown in the footer, per TMDB's terms.