## 0.1.0 -- e2e quote page 0.1.0

## [0.1.0] - 2026-08-11

### Added
- Astro static site scaffold: `package.json`, `astro.config.mjs` (explicit static output), `src/pages/index.astro`, `src/data/quotes.json` (five `{text, author}` quotes), and `README.md`. The page renders a centered quote in the system font stack on a dark background with no runtime network requests. (#284)
- `src/lib/pick.ts`: a generic, seed-deterministic `pick(items, seed)` used by the page at build time so the same seed always yields the same quote, while different seeds can yield different quotes; throws a descriptive error on an empty list. (#283)
- `src/styles/print.css`: a print-only stylesheet (black text on a white page, 12pt serif, nothing hidden) linked from `src/pages/index.astro` via a print media query. (#285)
- README section documenting how to add a new quote and confirming `npm ci && npm run build` writes `dist/index.html`. (#285)

### Changed
- n/a (first release)

### Fixed
- n/a (first release)
