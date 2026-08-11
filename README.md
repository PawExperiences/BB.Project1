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
npm run build
```

The built site is written to `dist/`.

## Preview

```sh
npm run preview
```
