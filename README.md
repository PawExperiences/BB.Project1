# e2e quote page

A minimal static Astro site that displays a single, randomly selected quote on
its home page. The quote is chosen once at build time (in the page's
frontmatter) from `src/data/quotes.json`, so the shipped page is fully static
with no client-side JavaScript.

## Install

```sh
npm ci
```

## Build

```sh
npm run build
```

The static site is generated into `dist/`, with the home page at
`dist/index.html`.
