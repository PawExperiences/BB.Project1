# e2e Quote Page

A minimal static site built with [Astro](https://astro.build) that displays a single quote, chosen at build time from a fixed set of five, on a dark, centered page.

## Install

```sh
npm ci
```

## Build

```sh
npm run build
```

Running `npm ci && npm run build` builds the static site and writes the output to `dist/index.html`.

## Adding a new quote

Quotes live in `src/data/quotes.json`, an array of objects with `text` and `author` fields. To add a new quote, append an object in the same shape to that array:

```json
{
  "text": "Your quote here.",
  "author": "Quote Author"
}
```

At build time, `src/pages/index.astro` deterministically selects one quote from `src/data/quotes.json` via `pick()` (`src/lib/pick.ts`), seeded by the build date, so no further wiring is needed after adding an entry.
