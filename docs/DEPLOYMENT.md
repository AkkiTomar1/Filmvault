# Deployment

Filmvault is a **static SPA** deployed to **GitHub Pages**. There is no server — everything runs client-side and talks to TMDB directly from the browser.

## Why hash routing + a base path

- `vite.config.js` sets `base: '/Filmvault/'` so asset URLs resolve on GitHub Pages under the `username.github.io/Filmvault/` path.
- `src/router.tsx` uses **`createHashRouter`**, so routes live after `#` (`/#/movie/123`). Hash-routing works on static hosts with zero server configuration — no 404 rewrites or `SPA fallback` needed.

> Keep `base` and the hash router in sync if you ever rename the repo, otherwise images/scripts and initial navigation will break.

## Environment secrets

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_TMDB_API_KEY` | local `.env` | Develop locally; **never committed** (`.env` is gitignored) |
| `TMDB_API_KEY` | GitHub **repo secret** | Injected into the CI build as `VITE_TMDB_API_KEY` |

`.env.example` documents the required key:

```
# Get a free API key from https://www.themoviedb.org/settings/api
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

To set the CI secret: **Repo → Settings → Secrets and variables → Actions → New repository secret → name `TMDB_API_KEY`, paste key.**

## GitLab Pages build

`.github/workflows/deploy.yml` — triggered on every push to `main` (and manually via `workflow_dispatch`):

1. Checkout (`actions/checkout@v4`)
2. Node 20 with npm cache (`actions/setup-node@v4`)
3. `npm ci`
4. `npm run lint`
5. `npm test`
6. `npm run build` with `VITE_TMDB_API_KEY: ${{ secrets.TMDB_API_KEY }}`
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

- The site **requires `VITE_TMDB_API_KEY`** at build time; without it, API calls fail (great place for a broken commit to show up in CI, which is why the secret is required).
- TMDB attribution must stay visible (footer) per their terms — do not remove it.
- Since the SPA is fully client-rendered, GitHub Pages serves the same `index.html` for every hash-route — deep links like `/#/movie/123` work as long as the fragment is intact.