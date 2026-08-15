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

This produces a production build in `dist/`, including `dist/index.html`.
