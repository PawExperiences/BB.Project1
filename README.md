# Space Invaders

No framework, no bundler, no package manager: hand-written HTML, CSS and ES
modules. The game runs entirely by opening `index.html` directly from the
filesystem (a `file://` URL) -- there is no build step and no server.

## Planned file layout

`index.html`, `game.js`, and `gameConfig.js` come from "Game loop and canvas
framework". `input.js` and `player.js` are added by this card ("Keyboard
input and the player ship"). The rest of the layout below is planned but
**not yet created** -- each remaining file is owned by a later, sibling card
and `game.js` leaves a one-line comment at each future import point naming
the owning card.

| File            | Owning card                     | Purpose                                     |
|-----------------|----------------------------------|----------------------------------------------|
| `index.html`    | Game loop and canvas framework   | Static page hosting the canvas               |
| `gameConfig.js` | Game loop and canvas framework   | Shared numeric constants                     |
| `game.js`       | Game loop and canvas framework   | Fixed-timestep loop, scene machine, HUD      |
| `input.js`      | Keyboard input and the player ship | Physically-held-key tracking               |
| `player.js`     | Keyboard input and the player ship | Player ship: movement, single-shot bullet, procedural draw |
| `invaders.js`   | Invaders                        | Invader grid, movement, formation logic      |
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
   - The canvas now shows a play field with a HUD reading `SCORE: 0`
     (top-left) and `LIVES: 3` (top-right), and a procedurally-drawn ship
     (arcs/rectangles, no image) near the bottom-center of the canvas.
3. Hold ArrowRight (or D). Confirm the ship moves right at a steady speed and
   stops with its right edge flush against the right side of the canvas --
   it never moves past that edge. Hold ArrowLeft (or A) and confirm the same
   at the left edge (x=0).
4. Tap Space once. Confirm a small white rectangle (the bullet) spawns at the
   ship and travels upward at a steady speed. While that bullet is still
   on-screen, press and hold Space repeatedly -- confirm no additional
   bullets appear (only ever one bullet at a time). Once the bullet scrolls
   above the top of the canvas, confirm it disappears and, if Space is still
   held, a new bullet immediately spawns.
5. To exercise the Game Over transition ahead of the cards that will drive
   gameplay (invaders, collision), set a breakpoint inside `game.js` (e.g. in
   `updatePlaying`) and edit `hudState.lives` to `0` in the debugger, then
   resume. Confirm that once `hudState.lives` reaches 0 while in the Playing
   scene, the scene machine automatically switches to Game Over and the
   canvas shows "GAME OVER", the final score, and "Press ENTER to restart".
   While stepping through, edit `hudState.lives` to a couple of different
   values first and confirm the `LIVES:` HUD text updates on the next frame
   to match.
6. Press ENTER on the Game Over scene. Confirm:
   - The page does not reload.
   - The scene machine returns to the Title scene, showing "SPACE INVADERS"
     and "Press ENTER to start" again.
7. Switch tabs away from the page for several seconds, then switch back.
   Confirm the game does not visibly "catch up" with a burst of fast-forward
   updates -- the accumulator clamp bounds the maximum queued update work.
