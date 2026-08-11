# Space Invaders (E2E demo)

A dependency-free Space Invaders clone: hand-written HTML/CSS/ES modules,
no bundler, no package manager. Open `index.html` directly from disk
(`file://`) -- nothing needs a server.

## Project layout

| File | Owner card | Status |
| --- | --- | --- |
| `index.html` | Game loop and canvas framework | shipped |
| `gameConfig.js` | Game loop and canvas framework | shipped |
| `game.js` | Game loop and canvas framework | shipped |
| `input.js` | Input / player card | planned |
| `player.js` | Input / player card | planned |
| `invaders.js` | Sprites / collision card | planned |
| `collision.js` | Sprites / collision card | planned |
| `level1.js` | Level 1 card | planned |
| `level2.js` | Level 2 card | planned |
| `level3.js` | Level 3 card | planned |
| `boss.js` | Boss card | planned |

This card (Game loop and canvas framework) only ships `index.html`,
`gameConfig.js`, `game.js`, and this README. It does not create, stub, or
implement any of the files above marked "planned" -- each is its own
reviewable PR from a sibling card. `game.js` marks the spots where those
cards will hook in with a single-line comment (no imports, no stub
functions).

## Manual verification

1. Open `index.html` directly in a browser (double-click it, or drag it into
   a browser window) -- no local server, no build step.
2. Confirm a dark 768x896 canvas is shown with "SPACE INVADERS" and
   "Press ENTER to start".
3. Press **ENTER**. The scene switches to Playing: the canvas shows the HUD
   (`SCORE`, `HI-SCORE`, `LIVES`) at the top, with no page reload.
4. Press **ENTER** again. The scene switches to Game Over: "GAME OVER" and
   "Final Score: <score>" are shown, along with "Press ENTER to restart".
5. Press **ENTER** once more. The scene returns to Title, score and lives
   are reset (hi-score is preserved), and the page has not reloaded or
   navigated -- the URL bar / history is unchanged throughout.
