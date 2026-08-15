## 0.1.0 -- e2e standup poster 0.1.0

# Changelog

## [0.1.0] - Initial release

### Added
- Standup card app scaffold: a static, backend-free Vite + React + TypeScript single-page app (`package.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.module.css`, `README.md`).
- Hardcoded standup card view in `src/App.tsx`: a date heading above three sections — Yesterday, Today, Blockers — each rendered as a bulleted list from a single in-file object literal (no fetch, no props, no external data file).
- Empty-Blockers handling: when the Blockers array is empty, the section renders the literal word "none" in a muted style instead of an empty bullet list.
- `StandupCard` presentational component (`src/StandupCard.tsx`): renders Done / In Progress / Blocked sections from three required `string[]` props, styled with Tailwind utility classes, covered by a Vitest + React Testing Library test.
- `Empty` placeholder component (`src/Empty.tsx`, named export `Empty`): renders a muted "None" message by default, or a custom `label` prop, for any section with no content.
- README documentation for install/build (`npm ci`, `npm run build`) and for `Empty`'s prop contract with a worked usage example.

### Changed
- (none — first release)

### Fixed
- (none — first release)

