# Space Invaders

A classic Space Invaders game built with hand-written HTML, CSS, and ES modules — no framework, no bundler, no npm.

## Manual Verification

1. Clone or download this repository to your local machine.
2. Open `index.html` directly in a modern browser (Chrome, Firefox, Edge, Safari) using the `file://` protocol — for example, double-click the file in your file manager, or drag it into your browser window.
3. Open the browser's developer console (F12 → Console tab).
4. Confirm that the message **`Space Invaders ready`** appears in the console with no errors.
5. Confirm that the page shows a black canvas centred on a black background with no scrollbars.

## Project Structure

| File | Purpose |
|---|---|
| `index.html` | Entry point — loads `style.css` and `main.js`; renders the game canvas |
| `main.js` | Bootstrap ES module — acquires the canvas 2D context and initialises the game |
| `style.css` | Minimal styles — black background, centred canvas, no scroll |

## Tech Stack

- Plain HTML5, CSS3, and ES modules
- No build step required; runs entirely from `file://`
- No npm, no bundler, no transpiler
