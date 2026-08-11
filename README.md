# badge-maker

Renders status badges as self-contained SVG documents.

## Usage

Import `badge` from the library's public entry point:

```ts
import { badge } from './dist/index.js';
```

`badge(label, message, colour?)` renders a self-contained SVG badge. The badge's width is derived automatically from the length of `label` and `message` — there is no separate width option.

A minimal badge, using the default message colour:

```ts
badge('build', 'passing');
```

A badge with a custom colour, passed as the third argument:

```ts
badge('coverage', '92%', '#dfb317');
```

A badge with a custom width, produced by using a longer label and message:

```ts
badge('platform support', 'linux, macos, windows');
```

The first example call above (`badge('build', 'passing')`) produces the following SVG, verbatim:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="98" height="20">
  <clipPath id="round">
    <rect width="98" height="20" rx="3"/>
  </clipPath>
  <g clip-path="url(#round)">
    <rect width="42.5" height="20" fill="#555"/>
    <rect x="42.5" width="55.5" height="20" fill="#4c1"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="21.25" y="14">build</text>
    <text x="70.25" y="14">passing</text>
  </g>
</svg>
```

Run `npm run example` to print this same badge's SVG to stdout:

```
npm run example
```

## Build

```
npm ci && npm run build
```

This installs dependencies from the committed lockfile and compiles the TypeScript sources in `src/` with `tsc`, producing `dist/index.js` and `dist/index.d.ts`.
