# Space Invaders (e2e project)

A hand-written, dependency-free browser game built with plain HTML, CSS and ES
modules. No bundler, no package manager, no build step — everything runs by
opening `index.html` directly from the filesystem (`file://`).

## File layout

### Game loop and canvas framework
- `index.html` — the page shell: a 768x896 `<canvas>` on a dark background, loads `game.js` as an ES module.
- `gameConfig.js` — shared constants (canvas size, player/bullet speed, starting lives).
- `game.js` — the fixed-timestep game loop, the Title/Playing/Game Over scene state machine, ENTER-driven scene transitions, and the canvas HUD (score/lives). Exports the `hudState` object (`score`, `lives`, `hiScore`) for later modules to mutate.

### Keyboard input and the player ship
- `input.js` — tracks currently-held keys from raw `keydown`/`keyup` transitions. Exports `initInput()` (registers the listeners, called once from `game.js`) and `isKeyHeld(key)` (returns whether `key` is currently down).
- `player.js` — exports the `Player` class: a ship that moves left/right (Arrow keys or A/D) at `PLAYER_SPEED`, clamped to the canvas edges; fires a single in-flight bullet upward at `BULLET_SPEED` on Space; is drawn procedurally with canvas arcs/rects only; and owns a lives counter (`getLives()` / `decrementLives()`, initialized from `STARTING_LIVES`, floored at 0). `game.js` creates one `Player` per run and drives it via `update(dt)` / `draw(ctx)` during the Playing scene. The player's own lives counter is independent of the HUD's `hudState.lives` — wiring hit detection to decrement the player and reflect that in the HUD/game-over flow is owned by the Level and Boss cards.

### This card (sprite rendering and collision detection)
- `invaders.js` — exports the `Invaders` class: an 11x5 grid (55 invaders) of identical flat-colored rectangles in classic formation spacing. `update(dt)` steps the whole formation sideways at a fixed interval; when the next step would carry any alive invader past the left or right canvas edge, the formation instead drops down a fixed step and reverses direction. `draw(ctx)` renders every alive invader plus a short fixed-duration explosion flash for invaders mid-kill. Also owns `bullets`, an array of invader-fired bullets that stays empty in this card — no invader shooting/AI is implemented here; that is deferred to "Level 2: they shoot back".
- `collision.js` — exports `collide(player, invaders, hudState)`: one generic AABB overlap check reused for both combat pairings. Player-bullet-vs-invader: removes the bullet, replaces the invader with its explosion, removes the invader, and increments `hudState.score` by a fixed amount. Invader-bullet-vs-player: removes the bullet and calls the player's existing `decrementLives()` hook once per overlap; it implements no lives/game-over logic itself. `game.js` calls `collide()` once per update step, after `player.update()`/`invaders.update()` and before that frame's `render()`, so collision resolution always completes before drawing.
- `game.js` now also exports the live `player` and `invaders` instances (in addition to `hudState`) so the manual verification steps below can reach them from the devtools console.

### Planned future cards (not yet created)
- `level1.js` — level 1 wave/layout definition.
- `level2.js` — level 2 wave/layout definition (introduces invader shooting/AI).
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
9. **Invader formation**: start a run. Confirm an 11-column by 5-row grid of
   identically colored/sized red rectangles appears near the top of the
   canvas. Watch it for a few seconds: the whole formation steps sideways
   together: when it reaches a canvas edge, it drops down a step and
   reverses direction, repeating indefinitely.
10. **Player-bullet-vs-invader collision**: fire at the formation (Space).
    When a bullet's bounding box overlaps an invader: the bullet disappears,
    a brief yellow explosion flashes where the invader was, the invader is
    then gone, and the HUD's `SCORE` value increases by the same fixed
    amount every time.
11. **Invader-bullet-vs-player collision** (no invader fires within this
    card's scope, so this path can't be reached through normal play — it is
    verified manually instead). With the Playing scene active, open the
    browser devtools console and run:
    ```js
    const m = await import('./game.js');
    const before = m.player.getLives();
    m.invaders.bullets.push({ x: m.player.x, y: m.player.y, width: 4, height: 4 });
    ```
    On the next frame the pushed bullet overlaps the player's bounding box,
    so the generic collision pass removes it from `m.invaders.bullets` and
    calls the player's existing `decrementLives()` hook exactly once. Confirm
    with `m.player.getLives() === before - 1` and that
    `m.invaders.bullets.length === 0`.
