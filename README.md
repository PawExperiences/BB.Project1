# e2e standup poster

A small, self-contained standup card. It renders the current date and three
sections — Yesterday, Today, Blockers — sourced from a single hardcoded data
object in `src/App.tsx`. When Blockers is empty, the section shows the word
"none" in a muted color instead of an empty list.

## Install

```
npm ci
```

## Develop

```
npm run dev
```

Starts the Vite dev server with hot reload.

## Build

```
npm run build
```

Bundles the app, writing output to `dist/index.html`.

## Preview

```
npm run preview
```

Serves the production build from `dist/` locally.
