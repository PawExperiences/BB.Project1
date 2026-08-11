## 0.1.0 -- e2e quote page 0.1.0

## [0.1.0] - 2026-08-11

### Added
- Astro static-site scaffold (`package.json`, `astro.config.mjs`) configured for static output (`output: 'static'`), with `astro` pinned to `^4.15` and a `build` script that runs `astro build`.
- Home page (`src/pages/index.astro`) that selects one quote at build time -- inside the page's frontmatter, executed during `astro build`, never client-side -- from `src/data/quotes.json`, rendering the quote centered on the page with the author beneath it in smaller, dimmer type. Dark background, system font stack only, zero runtime network requests.
- `src/data/quotes.json` with five `{text, author}` quote entries.
- Deterministic quote-picking utility `src/lib/pick.ts` exporting `pick<T>(quotes: T[], seed: string | number): T`, so the same commit + seed always renders the same quote on every rebuild (no `Math.random`/`Date.now`), and throws on an empty array.
- Print stylesheet `src/styles/print.css`: black text on a plain white page, 12pt serif, no page background, linked via `media="print"` so it has zero effect on screen rendering and hides nothing.
- `README.md` documenting install/build (`npm ci && npm run build` -> `dist/index.html`) and the steps to add a new quote.

### Changed
- N/A (first release).

### Fixed
- N/A (first release).

### Known Issues
- The git diffstat provided for "since last release" shows `package.json`, `astro.config.mjs`, `src/pages/index.astro`, `src/data/quotes.json`, `src/styles/print.css`, `package-lock.json` and `README.md` as pure deletions (5675 deletions, 0 insertions) -- i.e. none of them are evidenced as present at the commit this release would tag. No commit for `src/lib/pick.ts` appears in the given log at all. See the runbook's STOP-GATE steps; do not cut the tag until a human confirms the release commit actually contains these files.

