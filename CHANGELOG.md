## 0.1.0 -- e2e standup poster 0.1.0

# Changelog

## [0.1.0] - 2026-08-12

### Added
- Standup card single-page app (`src/App.tsx`, Vite + React + TypeScript): a heading showing the current date, computed at render time via `new Date()` (never a stored/hardcoded string), followed by Yesterday / Today / Blockers sections rendered as bulleted lists from a single hardcoded data object.
- Muted empty-state for Blockers: when the Blockers array is empty, the section renders the literal word "none" in a de-emphasized color instead of an empty bullet list.
- CSS Modules styling (`src/App.module.css`), per an explicit, documented deviation from the project blueprint's Tailwind/src-components convention for this task.
- `README.md` documenting install (`npm ci`), dev server usage, and build (`npm run build` -> `dist/index.html`).
- Base Vite + React + TypeScript toolchain: `package.json` (react ^18, react-dom ^18; vite ^5, @vitejs/plugin-react, typescript devDependencies), `vite.config.ts`, `index.html`, `src/main.tsx`.

### Changed
- N/A (first release).

### Fixed
- N/A (first release).

### Known issues (unresolved — see `summary` and manual steps, not fixed by this release)
- `src/StandupCard.tsx`, `src/StandupCard.test.tsx`, `src/Empty.tsx`, `tailwind.config.js`, `postcss.config.js` and `tsconfig.json` were added by two other bundled tasks ("The card component", "Empty states and the README") that specify Tailwind CSS + strict TS + Vitest. They are not imported/wired into `src/App.tsx`, so they don't affect the shipped app's behavior, but their presence directly conflicts with "The standup card" task's binding, closed acceptance criterion of "exactly these 7 authored files ... no tailwind config, no tsconfig.json, no test files." Not removed or resolved by this release — see manual steps.
- The most recent commit in the given range, `1b9c10d chore: reset for the next e2e project`, appears (per the diffstat: 16 files changed, 2072 deletions, 0 insertions) to delete the entire application. This release targets commit `fc75efd` ("feat: The standup card", the last commit known to contain the complete 7-file app), NOT current main/HEAD, pending human confirmation — see manual steps.
