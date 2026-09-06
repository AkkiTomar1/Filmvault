# Styling

## Tooling

- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin — the `@import "tailwindcss"` line in `src/index.css` is the only "entry" (no `tailwind.config`).
- Because it's v4, all utilities are used directly in JSX class strings. Custom theme values (fonts, colors, keyframes) are declared as plain CSS in `src/index.css`.
- Class names are composed straight in JSX. Repeated icon chips use tiny shared `className` strings in components rather than extracted CSS.

## Visual system

| Surface | Colors |
| --- | --- |
| Page background | `bg-gray-100` (set on `Layout`) |
| Navbar / Footer | Dark, translucent glass (`bg-gray-900/90`, `backdrop-blur`, gradient accents) |
| Hero banner | Dark cinematic gradient with image, film-grade overlays |
| Movie cards / posters | Dark poster image + light-on-dark overlays (rating, title bar) |
| Buttons / CTAs | `bg-blue-600` → `hover:bg-blue-500`, rounded-full; red for destructive |
| Inputs / pills | `bg-gray-200`, `rounded-full`, `focus:ring-2 focus:ring-blue-500` |
| MovieNight step panel | **White** card with `text-gray-900` headings — the explicit readability exception |

## Custom keyframes & decoration (`src/index.css`)

| Class / keyframe | Purpose |
| --- | --- |
| `@keyframes banner-kenburns` | Slow pan/zoom of the hero backdrop for a cinematic effect |
| `@keyframes banner-fade-up` / `animate-fade-up` | Staggered entrance for hero content (title, meta, chips, poster card) |
| `@keyframes banner-grain` / `banner-grain` | Film-grain noise layer (radial streaks) over the banner |
| Vignette overlays | Inline gradients darken edges so title/metadata stays readable |

```css
.banner-kenburns { animation: banner-kenburns 20s ease-in-out forwards; }
```

All animations are **gated behind `prefers-reduced-motion`**:

```css
@media (prefers-reduced-motion: reduce) {
  .banner-kenburns,
  .banner-grain,
  .animate-fade-up { animation: none; }
}
```

Reusable animation classes are applied conditionally in components (e.g. `.animate-fade-up` with inline `animation-delay` for the staggered entrance).

## Responsive conventions

- Poster **grid** (`MovieGrid`): `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`, edge-to-edge (`px-2 sm:px-3`).
- Movie **cards**: `w-full` with `aspect-[2/3]` so posters stay proportional at every size.
- Banner poster card only appears at `lg:` screens (floats to the right of the hero).
- Navbar collapses genre/search affordances on small screens via hidden/visible utility swaps.
- Watchlist table wraps in `overflow-x-auto` for small viewports.

## Accessibility rules of thumb

- Decorative icons use `aria-hidden="true"`; interactive icons (hearts, search, dice) get `aria-label`.
- Toast viewport is `aria-live="polite"`.
- All custom buttons are real `<button type="button">`.
- Focus rings are visible (e.g. `focus:ring-2 focus:ring-blue-500` on inputs).