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
| `input.js` | Input / player card | shipped |
| `player.js` | Input / player card | shipped |
| `invaders.js` | Sprites / collision card | planned |
| `collision.js` | Sprites / collision card | planned |
| `level1.js` | Level 1 card | planned |
| `level2.js` | Level 2 card | planned |
| `level3.js` | Level 3 card | planned |
| `boss.js` | Boss card | planned |

The Game loop and canvas framework card shipped `index.html`, `gameConfig.js`
and `game.js` with placeholder comments marking where player/enemy/collision
code would hook in. This card (Input and player) fills in the player half of
those hooks: `input.js`, `player.js`, and the `initInput()` / `player.update()`
/ `player.draw()` calls now wired into `game.js`'s loop. It does not create,
stub, or implement any of the files above marked "planned" -- each is its own
reviewable PR from a sibling card.

## Manual verification

1. Open `index.html` directly in a browser (double-click it, or drag it into
   a browser window) -- no local server, no build step.
2. Confirm a dark 768x896 canvas is shown with "SPACE INVADERS" and
   "Press ENTER to start".
3. Press **ENTER**. The scene switches to Playing: the canvas shows the HUD
   (`SCORE`, `HI-SCORE`, `LIVES`) at the top, with no page reload, and a
   green ship near the bottom-center of the canvas.
4. Hold **ArrowLeft** (or **A**): the ship moves left at a steady speed and
   stops exactly at the left edge of the canvas, never moving past it. Hold
   **ArrowRight** (or **D**): same, stopping exactly at the right edge.
5. Press **Space**: a small white bullet spawns at the ship and travels
   straight up. While it is on screen, pressing/holding Space again spawns no
   further bullets. Once it travels off the top of the canvas, Space fires a
   new bullet.
6. Press **ENTER** again. The scene switches to Game Over: "GAME OVER" and
   "Final Score: <score>" are shown, along with "Press ENTER to restart".
7. Press **ENTER** once more. The scene returns to Title, score and lives
   are reset (hi-score is preserved), and the page has not reloaded or
   navigated -- the URL bar / history is unchanged throughout.
