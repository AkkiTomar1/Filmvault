# State Management

Filmvault uses **React Context + local component state**. There is no state library, no server state, and no global store — server data is fetched per-page and held in component state.

## Provider tree

`src/main.tsx`

```
ToastProvider      → ClientProvider → RouterProvider
  WatchlistProvider   ↓
```

Both providers also render their UI (toast viewport) above `<Outlet />`.

## Watchlist (`src/context/WatchlistContext.tsx` + `src/hooks/useWatchlist.ts`)

Persisted to `localStorage` under the key `filmvault.watchlist`.

### API

| Member | Signature | Behavior |
| --- | --- | --- |
| `watchlist` | `Movie[]` | Current entries (ordered, newest first) |
| `isInWatchlist` | `(movieId: number) => boolean` | Membership check by `movie.id` |
| `addToWatchlist` | `(movie: Movie) => void` | Idempotent (no duplicates) |
| `removeFromWatchlist` | `(movieId: number) => void` | Removes by id |
| `clearWatchlist` | `() => void` | Empties the list |

### Persistence

- `useWatchlist()` initializes state by reading + parsing `localStorage` (wrapped in `try/catch`; corrupt data → `[]`).
- A `useEffect([watchlist])` writes back on every change, also wrapped in `try/catch` so private-mode / quota errors silently degrade to in-memory state.
- Updates are made with the functional form (`setWatchlist(prev => ...)`) so concurrent heart clicks never clobber each other.

### Access

```ts
const { watchlist, isInWatchlist, addToWatchlist, removeFromWatchlist, clearWatchlist } =
  useWatchlistContext()   // throws if used outside <WatchlistProvider>
```

## Combining watchlist + toasts

`useWatchlistToggle` (`src/hooks/useWatchlistToggle.ts`) is the single entry point every heart button uses:

```ts
const toggle = useWatchlistToggle()
toggle(movie)
```

Adding *or* removing always fires a toast; both toasts offer an **Undo** action that reverses the operation via `addToWatchlist`/`removeFromWatchlist`. The Watchlist page composes these directly for per-row Delete and Clear All (which snapshots the list before clearing to support Undo).

## Toasts (`src/context/ToastContext.tsx`)

### API

```ts
notify(message: string, options?: { actionLabel?: string; onAction?: () => void }): void
```

- Each toast auto-dismisses after **3 s** (`TOAST_DURATION`).
- If `actionLabel` + `onAction` are provided, an action link renders that calls `onAction()` then dismisses.
- A close (✕) button dismisses early.
- The viewport is `aria-live="polite"` for screen readers; multiple toasts stack bottom-center, above everything (`z-50`).

### Implementation notes

- Toast ids come from a `useRef` counter (`++idRef.current`) so they're stable and never collide.
- `dismiss` filters by id; `notify` schedules `window.setTimeout` per toast.

## Local component state

- **Search/filters/pagination** — held in each page's `useState`; passed down as props (no lifting to context).
- **Debounced inputs** — `useDebounce(value, delay)` returns a delayed copy (used for navbar search 300 ms, watchlist search 200 ms).
- **Fetch data** — held in page state with a `{ loading, error, data }` shape; see [ARCHITECTURE.md](ARCHITECTURE.md) for the race-safe pattern.

## Testing stateful components

Tests mount parts of the provider tree (e.g. `WatchlistPage` inside `WatchlistProvider` + `ToastProvider`) and clear `localStorage` between tests. See [TESTING.md](TESTING.md).