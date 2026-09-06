# 🎬 Filmvault

Discover trending movies, search the entire TMDB catalog, and curate your personal watchlist — built with **React 19**, **Vite**, **Tailwind CSS v4**, and **TypeScript**.

## ✨ Features

- 🏠 **Trending movies** with pagination (`Page X of Y`) and scroll-to-top.
- 🔍 **Search** the TMDB catalog with debounced input and paginated results.
- 🎬 **Movie detail pages** — overview, runtime, genres, rating bar, cast, YouTube trailer, and similar movies.
- 🗂️ **Watchlist** — persisted to `localStorage`, with **working** genre filters, search, sorting, and real genre names.
- 🔖 **Genre browsing** — filter by any of the 19 TMDB genres with a pill UI.
- 🔄 **Toast notifications** with **Undo** for add/remove/clear actions.
- 🖼️ Smart loading skeletons, graceful error states with retry, and fallback images.
- ⚡ Code-splitting via route-level lazy loading; race-condition-safe fetches (AbortController).

## 🧑‍💻 Getting Started

### Prerequisites

- Node.js 20+
- A free [TMDB API key](https://www.themoviedb.org/settings/api)

### Setup

```bash
npm install
cp .env.example .env   # then paste your real API key into .env
npm run dev            # http://localhost:5173
```

> **Environment variables** (`.env`): `VITE_TMDB_API_KEY`. Never commit real keys — `.env` is gitignored.

## 📜 Scripts

| Command               | Description                              |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Start Vite dev server                    |
| `npm run build`       | Type-check (`tsc`) then production build |
| `npm run typecheck`   | Run TypeScript type checker              |
| `npm run lint`        | ESLint (JS + TS + React hooks)           |
| `npm test`            | Run the Vitest suite once                |
| `npm run test:watch`  | Run Vitest in watch mode                 |
| `npm run preview`     | Preview the production build             |
| `npm run deploy`      | Lint → test → build → deploy to Pages    |

## 🛠 Tech Stack

- **React 19** + **react-router-dom v7** (`createHashRouter`, route `lazy`, data `loader`)
- **Vite 7** with `@vitejs/plugin-react` + `@tailwindcss/vite`
- **Tailwind CSS v4**
- **Axios** (TMDB REST API)
- **react-icons**
- **TypeScript** (strict)
- **Vitest** + **React Testing Library**

## 🔐 CI / Deployment

`.github/workflows/deploy.yml` runs on pushes to `main`:

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `npm run build` (injected with `VITE_TMDB_API_KEY` secret)
5. Publish `dist/` to **GitHub Pages**

To deploy, add a repo secret named `TMDB_API_KEY` with your API key.

## 📁 Project Structure

```
src/
├── api/         # TMDB API layer (axios + typed endpoints)
├── assets/      # Static images
├── components/  # Layout, Navbar, Footer, Banner, MovieCard, Pagination, …
├── context/     # Watchlist context, Toast context
├── hooks/       # useWatchlist, useDebounce, useWatchlistToggle
├── lib/         # Image/format helpers
├── pages/       # Home, Search, Details, Watchlist, Genre
├── test/        # Vitest setup
└── types/       # TMDB model types
```