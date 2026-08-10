# Space Invaders

No framework, no bundler, no package manager: hand-written HTML, CSS and ES
modules. The game runs entirely by opening `index.html` directly from the
filesystem (a `file://` URL) -- there is no build step and no server.

## Planned file layout

This card ("Game loop and canvas framework") creates only `index.html`,
`game.js`, `gameConfig.js`, and this `README.md`. The rest of the layout below
is planned but **not yet created** -- each file is owned by a later, sibling
card and `game.js` leaves a one-line comment at each future import point
naming the owning card.

| File            | Owning card                    | Purpose                                   |
|-----------------|---------------------------------|--------------------------------------------|
| `index.html`    | Game loop and canvas framework  | Static page hosting the canvas             |
| `gameConfig.js` | Game loop and canvas framework  | Shared numeric constants                   |
| `game.js`       | Game loop and canvas framework  | Fixed-timestep loop, scene machine, HUD    |
| `input.js`      | Input handling                  | Keyboard input beyond ENTER (movement/fire)|
| `player.js`     | Player movement & shooting      | Player ship state, movement, bullets       |
| `invaders.js`   | Invaders                        | Invader grid, movement, formation logic    |
| `collision.js`  | Collision detection             | Bullet/ship/invader collision checks       |
| `level1.js`     | Level 1                         | Level 1 wave definition and behavior       |
| `level2.js`     | Level 2                         | Level 2 wave definition and behavior       |
| `level3.js`     | Level 3                         | Level 3 wave definition and behavior       |
| `boss.js`       | Boss fight                      | Boss encounter logic                       |

## Manual verification (file:// URL)

**Tested in Firefox.** ES module `<script type="module">` loading over a
`file://` URL is blocked by CORS in Chrome/Edge, but works in Firefox --
open `index.html` in Firefox for the steps below.

1. Open `index.html` directly in Firefox (double-click it, or File > Open
   File). Confirm:
   - No errors appear in the browser console (Ctrl+Shift+K).
   - A 768x896 `<canvas>` is visible on a dark-background page.
   - The canvas shows "SPACE INVADERS" and "Press ENTER to start" (Title
     scene).
2. Press ENTER. Confirm:
   - The page does not reload (URL bar / navigation is unchanged).
   - The canvas now shows an otherwise empty play field with a HUD reading
     `SCORE: 0` (top-left) and `LIVES: 3` (top-right).
3. To exercise the Game Over transition ahead of the cards that will drive
   gameplay (player, invaders, collision), set a breakpoint inside `game.js`
   (e.g. in `updatePlaying`) and edit `hudState.lives` to `0` in the
   debugger, then resume. Confirm that once `hudState.lives` reaches 0 while
   in the Playing scene, the scene machine automatically switches to Game
   Over and the canvas shows "GAME OVER", the final score, and "Press ENTER
   to restart".
5. Press ENTER on the Game Over scene. Confirm:
   - The page does not reload.
   - The scene machine returns to the Title scene, showing "SPACE INVADERS"
     and "Press ENTER to start" again.
6. Switch tabs away from the page for several seconds, then switch back.
   Confirm the game does not visibly "catch up" with a burst of fast-forward
   updates -- the accumulator clamp bounds the maximum queued update work.
