# e2e quote page

A minimal static site, built with [Astro](https://astro.build), that displays
a single quote picked at random at build time from a fixed set of five
quotes.

## What it does

`src/data/quotes.json` holds five `{ text, author }` quotes. At build time,
`src/pages/index.astro` picks one of them in its frontmatter script and
renders it as static HTML — the quote text centered on a dark page, with the
author's name shown beneath it in smaller, dimmer type. No client-side
JavaScript and no network requests are involved; the page is fully static.

## Install

```sh
npm ci
```

## Build

```sh
npm ci && npm run build
```

This installs dependencies and writes the built site to `dist/`, including
`dist/index.html`.

## Preview

```sh
npm run preview
```

## Adding a new quote

Quotes live in `src/data/quotes.json`, a JSON array of `{ text, author }`
objects. To add one, append a new object to the array:

```json
{
  "text": "Your quote text here.",
  "author": "Quote Author"
}
```

The page picks one quote at random from this file at build time
(`src/pages/index.astro`), so no other code changes are needed — just run
`npm run build` again to regenerate the site.

## Print styles

`src/styles/print.css` is linked from the page with `media="print"` and
restyles the quote for paper: black text on a white background in a 12pt
serif typeface. It only changes appearance — no content is hidden when
printing or exporting to PDF.
