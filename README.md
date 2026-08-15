# Space Invaders (e2e project)

A hand-written, dependency-free browser game built with plain HTML, CSS and ES
modules. No bundler, no package manager, no build step — everything runs by
opening `index.html` directly from the filesystem (`file://`).

## File layout

### This card (game loop and canvas framework)
- `index.html` — the page shell: a 768x896 `<canvas>` on a dark background, loads `game.js` as an ES module.
- `gameConfig.js` — shared constants (canvas size, player/bullet speed, starting lives).
- `game.js` — the fixed-timestep game loop, the Title/Playing/Game Over scene state machine, ENTER-driven scene transitions, and the canvas HUD (score/lives). Exports the `hudState` object (`score`, `lives`, `hiScore`) for later modules to mutate.

### Planned future cards (not yet created)
- `input.js` — keyboard input handling (movement, firing) consumed by the Playing scene.
- `player.js` — the player ship: sprite, movement, shooting.
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
   and the HUD in the top-left shows `SCORE: 0` and `LIVES: 3`.
4. **Backgrounding**: switch to another tab for several seconds, then switch
   back. The game should resume smoothly, without visibly "catching up" or
   freezing — the accumulated update time is clamped, so a large gap does not
   trigger a burst of queued update steps.
5. **Game Over**: since no gameplay exists yet (added by later cards), lives
   never drop below the starting value in this card, so the Game Over scene
   cannot be reached through play. To verify it directly, temporarily set
   `hudState.lives = 0` from the browser devtools console while in the
   Playing scene, and confirm on the next frame the scene switches to Game
   Over, rendering "GAME OVER", the numeric score, and "Press ENTER to
   restart".
6. **Restart**: with Game Over showing, press ENTER. The scene switches back
   to Title (no page reload), ready to start again.
