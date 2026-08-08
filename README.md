# Space Invaders – BB.Project1

A hand-written, dependency-free Space Invaders game built with plain HTML, CSS, and ES modules.

## Manual Verification

### How to open the game

1. Clone (or download) this repository to your local machine.
2. Navigate to the repository root in your file manager or terminal.
3. Open `index.html` directly in a modern browser (Chrome, Firefox, Edge, Safari):
   - **Double-click** `index.html` in your file manager, **or**
   - Drag and drop `index.html` onto an open browser window, **or**
   - From a terminal: `open index.html` (macOS) / `xdg-open index.html` (Linux) / `start index.html` (Windows).

The page loads via a `file://` URL – no local server, no npm install, no build step required.

### What to check

| Check | Expected result |
|---|---|
| Page title (browser tab) | **Space Invaders** |
| Page background | Solid black |
| Canvas element | A black rectangle centred on the page with a subtle dark border |
| Browser console (F12 → Console) | **No errors or warnings** |
| Network tab | No external requests; all resources loaded from `file://` |

### Files in this project

```
index.html   – Page entry point; contains the <canvas> element
main.js      – ES-module entry point; wires up the canvas context
style.css    – Minimal layout and colour styles
README.md    – This file
```

## Project stack

- **No framework, no bundler, no package manager.**
- Plain HTML5, CSS3, and ES modules (`type="module"`).
- Runs entirely from `file://` – nothing to install.

## Development notes

- All game logic will be added in subsequent tasks as ES modules imported by `main.js`.
- Keep all asset paths relative to `index.html` so the `file://` constraint is maintained.
