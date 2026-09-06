# Testing

Filmvault is tested with **Vitest** + **React Testing Library**, running in a **jsdom** environment. Tests live next to the code they cover as `*.test.ts` / `*.test.tsx`.

## Configuration

`vite.config.js`

```js
test: {
  environment: 'jsdom',
  setupFiles: './src/test/setup.ts',
  css: false,
  globals: false,
}
```

- `css: false` skips CSS processing (utility classes are untestable and irrelevant).
- Tests **import functions explicitly** (`import { describe, it, expect } from 'vitest'`) since globals are off.
- `src/test/setup.ts` loads `@testing-library/jest-dom` (for `toBeInTheDocument`, etc.) and clears `localStorage` / mocks between tests.

## Suite overview — 8 files, 57 tests

| File | Covers |
| --- | --- |
| `src/api/tmdb.test.ts` | Axios layer: response unwrapping (`res.data`), genres caching (`getGenres` calls API once, `resetGenreCache` refetches), `genreName`, watch-providers region fall-back (incl. `provider_id`/`provider_name` shape), `getDiscoverMovies` query building, `getRandomMovie` page-range + empty-guard, **retry-once resilience** (network errors retried; HTTP errors & aborts not retried) |
| `src/api/watchmode.test.ts` | `/sources/` catalog build + caching, per-title `/title/movie-{id}/sources/` call with region + caching, `getWatchmodeOffers` joining logos onto title sources (dedupe by `source_id`, drops sources without `web_url` / region mismatch), **plan-region gate** (unsupported regions short-circuit without calling the title endpoint), graceful empty-array on bad data |
| `src/hooks/useWatchlist.test.ts` | Add (no dupes), remove, clear, localStorage round-trip, corrupt-data guard |
| `src/lib/provider-links.test.ts` | `buildProviderUrl`: exact provider match, Amazon/Prime aliases, `+`-based names (Disney+, Paramount+), `HBO Max`→Max, substring fallback (`Peacock Premium`), title URL-encoding, `null` for unknown **and malformed/empty** names |
| `src/lib/region.test.ts` | `detectRegion`: `en-US`→US, `en-IN`→IN, `pt-BR`→BR, `zh-Hant-TW`→TW, `en`→US fallback, plus `VITE_WATCHMODE_REGION` override (applied, uppercased/trimmed, invalid values ignored) |
| `src/lib/pagination.test.ts` | `getPageNumbers` at page 1 / middle / last, small totals (`<=7` → all pages), clamping, ellipsis placement |
| `src/components/MovieCard.test.tsx` | Render title/rating; watchlist heart toggles via `useWatchlistToggle`; rating badge shows formatted score |
| `src/pages/WatchlistPage.test.tsx` | Empty state (emoji + CTA), table render with filter pills, search + genre filter, sort, delete with undo toast |

## Patterns

### Mocking `fetch` (JS-only tests)

API tests stub the network, not axios internals:

```ts
vi.spyOn(global, 'fetch').mockResolvedValue({ json: async () => payload } as Response)
```

(axios in jsdom uses the global fetch implementation — this is the seam the API tests stub.)

### Rendering with providers

Components that need context are mounted inside the real providers:

```tsx
render(
  <ToastProvider>
    <WatchlistProvider>
      <MovieCard movie={fakeMovie} />
    </WatchlistProvider>
  </ToastProvider>,
)
```

This means tests also verify the undo-toast wiring, not just rendering.

### Running

```bash
npm test          # single run (CI)
npm run test:watch
```

Tests are part of CI (`.github/workflows/deploy.yml`) so a broken test blocks deployment.