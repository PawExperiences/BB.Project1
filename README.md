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
npm ci && npm run build
```

This installs dependencies and builds the static site into `dist/`, writing
the home page to `dist/index.html`.

## Adding a quote

Quotes live in `src/data/quotes.json` as a JSON array of objects, each with a
`text` and an `author` field. To add a new quote:

1. Open `src/data/quotes.json`.
2. Add a new object to the array with `text` (the quote) and `author` (who
   said it), for example:

   ```json
   {
     "text": "Simplicity is the ultimate sophistication.",
     "author": "Leonardo da Vinci"
   }
   ```

3. Save the file and run `npm run build` to confirm the site still builds. A
   quote is picked at random at build time, so the new entry may not appear
   on every build until you rebuild a few times.
