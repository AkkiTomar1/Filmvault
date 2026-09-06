# Deployment

Filmvault is a **static SPA** deployed to **GitHub Pages**. There is no server — everything runs client-side and talks to TMDB directly from the browser.

## Why clean URLs + a base path + SPA fallback

- `vite.config.js` sets `base: '/Filmvault/'` so asset URLs resolve on GitHub Pages under the `username.github.io/Filmvault/` path.
- `src/router.tsx` uses **`createBrowserRouter`** with `basename: import.meta.env.BASE_URL` — URLs stay clean (`/movie/123`), and the basename keeps route matching aligned with wherever the app is served (dev, preview, and Pages).
- A tiny Vite plugin (`spa-404-fallback` in `vite.config.js`) copies `dist/index.html` → `dist/404.html` at the end of every build. GitHub Pages can't rewrite paths, so a direct visit or refresh of `/Filmvault/movie/123` returns the 404 doc — serving `404.html` (identical HTML) lets the router mount and render the right page.

> Keep `base` and the `basename` (`import.meta.env.BASE_URL`) in sync if you ever rename the repo, otherwise asset paths or initial navigation will break.

## Environment secrets

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_TMDB_API_KEY` | local `.env` | TMDB catalogue; develop locally; **never committed** (`.env` is gitignored) |
| `TMDB_API_KEY` | GitHub **repo secret** | Injected into the CI build as `VITE_TMDB_API_KEY` |
| `VITE_WATCHMODE_API_KEY` | local `.env` | Watchmode deeplinks for the Where to Watch section |
| `WATCHMODE_API_KEY` | GitHub **repo secret** | Injected into the CI build as `VITE_WATCHMODE_API_KEY` |
| `VITE_WATCHMODE_REGION` | local `.env` (optional) | Forces the streaming region (2-letter code) instead of deriving it from the browser locale. Must be a plan-enabled region (free tier: `CA`, `IN`, `RU`) so exact Watchmode deeplinks render. |

`.env.example` documents both keys plus the optional override:

```
# Get a free API key from https://www.themoviedb.org/settings/api
VITE_TMDB_API_KEY=your_tmdb_api_key_here

# Get a free API key from https://www.watchmode.com
VITE_WATCHMODE_API_KEY=your_watchmode_api_key_here

# Optional: force the Where to Watch region (plan-enabled, e.g. IN). Unset = derive from browser locale.
VITE_WATCHMODE_REGION=
```

To set CI secrets: **Repo → Settings → Secrets and variables → Actions → New repository secret** for each of `TMDB_API_KEY` and `WATCHMODE_API_KEY`, pasting the matching key.

## GitLab Pages build

`.github/workflows/deploy.yml` — triggered on every push to `main` (and manually via `workflow_dispatch`):

1. Checkout (`actions/checkout@v4`)
2. Node 20 with npm cache (`actions/setup-node@v4`)
3. `npm ci`
4. `npm run lint`
5. `npm test`
6. `npm run build` with `VITE_TMDB_API_KEY: ${{ secrets.TMDB_API_KEY }}` and `VITE_WATCHMODE_API_KEY: ${{ secrets.WATCHMODE_API_KEY }}`
   - `build` itself runs `tsc --noEmit && vite build`, so the type-check must pass too.
7. Publish `./dist` with `peaceiris/actions-gh-pages@v4` (`publish_dir: ./dist`)

The workflow has `permissions: contents: write`, a `pages` concurrency group (cancels in-progress deploys), and `concurrency.cancel-in-progress: true`.

### Configuring Pages

- Go to **Repo → Settings → Pages**.
- Source: **Deploy from a branch**, branch `gh-pages`, folder `/ (root)`.
- The action pushes the finished build to the `gh-pages` branch automatically.

## Manual deploy

```bash
npm run deploy    # predeploy: npm run build  →  gh-pages -d dist
```

Requires `gh-pages` (devDependency) and push access. CI is the recommended path since it also gates lint/tests/build.

## Local production check

```bash
npm run build
npm run preview   # serves dist at http://localhost:4173/Filmvault/
```

## Gotchas

- The site **requires `VITE_TMDB_API_KEY`** at build time; without it, API calls fail (great place for a broken commit to show up in CI, which is why the secret is required). `VITE_WATCHMODE_API_KEY` is optional — without it the app still runs, and Where to Watch falls back to built-in provider template links (the Watchmode calls are wrapped and fail closed).
- Watchmode free-tier data must display their attribution ("Streaming links by Watchmode") — kept in the movie details page.
- TMDB attribution must stay visible (footer) per their terms — do not remove it.
- Since the SPA is fully client-rendered, every route still serves the same `index.html`/`404.html` from GitHub Pages — deep links like `/movie/123` work in-app, and refreshes on them work through the `404.html` fallback emitted at build time.