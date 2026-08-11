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
| `invaders.js` | Sprites / collision card | shipped |
| `collision.js` | Sprites / collision card | shipped |
| `level1.js` | Level 1 card | planned |
| `level2.js` | Level 2 card | planned |
| `level3.js` | Level 3 card | planned |
| `boss.js` | Boss card | planned |

The Game loop and canvas framework card shipped `index.html`, `gameConfig.js`
and `game.js` with placeholder comments marking where player/enemy/collision
code would hook in. The Input and player card filled in the player half of
those hooks: `input.js`, `player.js`, and the `initInput()` / `player.update()`
/ `player.draw()` calls wired into `game.js`'s loop. This card (Sprite
rendering and collision detection) fills in the enemy half: `invaders.js`
(the 11x5 invader grid and its sideways/drop movement) and `collision.js`
(the AABB collision check, the bullet-vs-invader and invader-bullet-vs-player
checks, the kill explosion effect, and the score increment), wired into
`game.js`'s loop via `invaderFormation.update()` / `collide()` (before that
frame's render) and `invaderFormation.draw()` / `drawExplosions()` (during
render). It does not create, stub, or implement any of the files above
marked "planned" -- each is its own reviewable PR from a sibling card.

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
8. Press **ENTER** to start a new game. Confirm an 11-column x 5-row grid of
   55 identical red rectangles (the invaders) is shown near the top of the
   canvas. Watch it move sideways as a single unit; when it reaches either
   canvas edge, confirm the whole grid reverses direction and steps down by
   a small fixed amount before continuing to move sideways -- it never
   overlaps the canvas edge.
9. Move the ship under an invader and press **Space** to fire. When the
   bullet reaches an invader, confirm: the invader disappears, a brief
   orange explosion flashes at that spot and then disappears on its own,
   and `SCORE` in the HUD increases by a fixed amount. The bullet is also
   consumed by the hit (no bullet continues past the invader it struck).
10. Invader-bullet-vs-player: `collision.js` detects an invader bullet
    overlapping the ship and responds by calling the same player-hit
    response (`player.loseLife()`) already established by the Input and
    player card -- no new life/game-over behaviour is introduced here.
    Invaders don't fire bullets yet (that ships with "Level 2: they shoot
    back"), so this path has no bullets to find and isn't independently
    observable in the browser today; once Level 2 adds invader bullets, an
    invader bullet touching the ship should immediately decrement `LIVES`
    in the HUD with no other change in game flow.
