# Space Invaders (e2e project)

A hand-written, dependency-free browser game built with plain HTML, CSS and ES
modules. No bundler, no package manager, no build step — everything runs by
opening `index.html` directly from the filesystem (`file://`).

## File layout

### Game loop and canvas framework
- `index.html` — the page shell: a 768x896 `<canvas>` on a dark background, loads `game.js` as an ES module.
- `gameConfig.js` — shared constants (canvas size, player/bullet speed, starting lives).
- `game.js` — the fixed-timestep game loop, the Title/Playing/Game Over scene state machine, ENTER-driven scene transitions, and the canvas HUD (score/lives). Exports the `hudState` object (`score`, `lives`, `hiScore`) for later modules to mutate.

### This card (keyboard input and the player ship)
- `input.js` — tracks currently-held keys from raw `keydown`/`keyup` transitions. Exports `initInput()` (registers the listeners, called once from `game.js`) and `isKeyHeld(key)` (returns whether `key` is currently down).
- `player.js` — exports the `Player` class: a ship that moves left/right (Arrow keys or A/D) at `PLAYER_SPEED`, clamped to the canvas edges; fires a single in-flight bullet upward at `BULLET_SPEED` on Space; is drawn procedurally with canvas arcs/rects only; and owns a lives counter (`getLives()` / `decrementLives()`, initialized from `STARTING_LIVES`, floored at 0). `game.js` creates one `Player` per run and drives it via `update(dt)` / `draw(ctx)` during the Playing scene. The player's own lives counter is independent of the HUD's `hudState.lives` — wiring hit detection to decrement the player and reflect that in the HUD/game-over flow is owned by the Level and Boss cards.

### Planned future cards (not yet created)
- `invaders.js` — the invader grid: sprites, formation movement, firing.
- `collision.js` — collision detection between bullets, player, and invaders.
- `level1.js` — level 1 wave/layout definition.
- `level2.js` — level 2 wave/layout definition.
- `level3.js` — level 3 wave/layout definition.
- `boss.js` — boss enemy behavior and encounter.

Each future module has a one-line comment marking its future import point at
the top of `game.js`; none of them are created, stubbed, or imported by this
card.

## Manual verification (file://, no server)

1. Open `index.html` directly in a browser (double-click it, or use
   `File > Open` — a `file://...` URL). Do not run a local server.
2. **Title screen**: confirm a 768x896 canvas appears on a dark page
   background showing the text "SPACE INVADERS" and "Press ENTER to start".
   Check the browser devtools console — there should be no errors.
3. **Start**: press ENTER. The scene switches to Playing (no page reload)
   and the HUD in the top-left shows `SCORE: 0` and `LIVES: 3`. A procedurally
   drawn ship (arcs and rectangles, no images) appears near the bottom-center
   of the canvas.
4. **Movement**: hold ArrowLeft or `A` — the ship moves left smoothly and
   stops exactly at the left canvas edge (it never moves partially off-screen).
   Hold ArrowRight or `D` — same behavior at the right edge. Movement speed
   should look identical regardless of frame rate.
5. **Firing**: press Space — a small yellow bullet spawns at the ship and
   travels upward off the top of the canvas. While that bullet is on screen,
   further Space presses/holds do not spawn another bullet. Once the bullet
   scrolls off the top, pressing (or continuing to hold) Space fires a new one.
6. **Backgrounding**: switch to another tab for several seconds, then switch
   back. The game should resume smoothly, without visibly "catching up" or
   freezing — the accumulated update time is clamped, so a large gap does not
   trigger a burst of queued update steps.
7. **Game Over**: since nothing can hit the player yet (added by later Level
   cards), the HUD's lives never drop on their own, so the Game Over scene
   cannot be reached through play. To verify it directly, temporarily set
   `hudState.lives = 0` from the browser devtools console while in the
   Playing scene, and confirm on the next frame the scene switches to Game
   Over, rendering "GAME OVER", the numeric score, and "Press ENTER to
   restart".
8. **Restart**: with Game Over showing, press ENTER. The scene switches back
   to Title (no page reload), the ship resets to its starting position, and
   any in-flight bullet is cleared, ready to start again.
