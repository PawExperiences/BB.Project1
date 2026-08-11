## 0.1.0 -- e2e badge maker 0.1.0

# Changelog

All notable changes to `badge-maker` are documented in this file.

## [0.1.0] - 2026-08-11

### Added
- `badge(label, message, colour?)` in `src/index.ts`: renders a self-contained SVG status badge -- 20px tall, rounded corners, `#555`-filled label half, colour-filled message half (default `#4c1`) -- with `&`, `<`, `>` escaped to `&amp;`, `&lt;`, `&gt;` in embedded text. Each half is sized 6.5px per character plus 10px padding. (#231)
- `src/measure.ts`: single source of truth for badge sizing/colour -- `textWidth(s)` (`6.5 * s.length + 20`) and `colourFor(name)` (`green`->`#97ca00`, `yellow`->`#dfb317`, `red`->`#e05d44`, `grey`->`#9f9f9f`, else `#4c1`) -- with a Vitest suite in `src/measure.test.ts`. `src/index.ts` imports both instead of computing them inline. (#230)
- Project scaffolding: `package.json` (`badge-maker` v0.1.0, `"type": "module"`, `build` script running `tsc`, `typescript: "^5.4"` as the sole devDependency), `tsconfig.json` (`target: ES2022`, `module: NodeNext`, `outDir: dist`, `rootDir: src`, `declaration: true`), and the generated `package-lock.json`.
- README `Usage` section with three worked examples (default badge, custom colour, custom width) and the literal SVG markup produced by the first example, plus a new `npm run example` script that prints that same badge's SVG to stdout so the doc and the code stay in sync. (#232)
- Documented build commands: `npm ci && npm run build` produces `dist/index.js` and `dist/index.d.ts`.

