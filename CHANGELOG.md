## 0.1.0 -- e2e quote page 0.1.0

## [0.1.0] - 2026-08-11

### Added
- Astro static site scaffold (`package.json`, `astro.config.mjs` with `output: "static"`) with a `build` script that runs `astro build`.
- Home page (`src/pages/index.astro`) rendering one of five quotes chosen at build time: quote text centered, author credited beneath in smaller, dimmer type, on a dark background using only the system font stack — zero runtime JS, no network calls.
- Quotes dataset (`src/data/quotes.json`): exactly 5 `{ text, author }` entries.
- Deterministic quote picker (`src/lib/pick.ts`): `pick<T>(items, seed)` returns the same item for the same seed across runs/processes; the home page seeds it with the build date so a given build's quote is reproducible, not random.
- Print stylesheet (`src/styles/print.css`), linked with `media="print"`: black text on a white background, 12pt serif body copy, no content hidden.
- `README.md`: install/build usage (`npm ci && npm run build` -> `dist/index.html`) and how to add a new quote via `src/data/quotes.json`.

This is the first release (no previous version) — everything above is new.
