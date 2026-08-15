# Standup Card

A static, single-page React + TypeScript app (built with Vite) that renders a single
"standup card": a date heading followed by three sections — **Yesterday**, **Today**,
and **Blockers** — each shown as a bulleted list. All data is hardcoded in `src/App.tsx`;
there is no backend, fetch, or props. If the Blockers list is empty, the section shows
the word "none" in a muted style instead of an empty list.

## Install

```sh
npm ci
```

## Build

```sh
npm run build
```

Running `npm ci && npm run build` builds the app and writes `dist/index.html`.

## Empty

`src/Empty.tsx` is a reusable placeholder for empty sections (e.g. a
standup section with no updates or no blockers). It renders a muted,
de-emphasized message instead of showing nothing or an empty list.

| Prop    | Type     | Required / default        | Description                                      |
| ------- | -------- | -------------------------- | ------------------------------------------------- |
| `label` | `string` | Optional, defaults to `"None"` | Text to display in place of the default `"None"`. |

### Usage

```tsx
import { Empty } from './Empty'

// Default label
<Empty />

// Custom label
<Empty label="No blockers" />
```
