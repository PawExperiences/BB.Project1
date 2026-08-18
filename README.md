# BB.Project1 — Space Invaders

A hand-written HTML/CSS/ES-modules Space Invaders clone. No framework, no
bundler, no package manager.

## Running the game

Open `index.html` directly in a browser (double-click it, or open the
`file://` path). There is no build step, no dev server, and nothing to
install — the page loads `game.js` as an ES module and runs. Use a browser
that allows ES modules over `file://` (e.g. Firefox or Safari).

## Environment note

No build tooling exists in this repo today. If future cards introduce one,
the assumed environment is **Node 20 LTS** with **pnpm** as the package
manager. Until then, none of that is required to run or verify the game.

## Manual verification checklist

Open `index.html` via a `file://` URL and check:

- [ ] Title scene shows "SPACE INVADERS" and "Press ENTER to start"; the
      canvas is 768×896 on a dark page background.
- [ ] Pressing ENTER on the Title scene moves to the Playing scene; the HUD
      shows `Score: 0` and `Lives: 3` (score/lives are reset on entry).
- [ ] Playing scene shows the HUD (Score, Lives, Hi, plus the current
      `LEVEL n` centered on the top line) drawn on the canvas itself, plus
      the player ship near the bottom edge: a small green cannon/hull/dome
      shape, horizontally centered.
- [ ] Hold ArrowLeft / ArrowRight: the ship slides left/right at a steady
      200 px/s. The A and D keys do the same. The speed does not depend on
      the display's refresh rate (movement is dt-scaled).
- [ ] Keep holding a direction into either screen edge: the ship stops
      cleanly — its left edge never goes below `x = 0` and its right edge
      never passes the right canvas edge, no matter how long the key is
      held.
- [ ] Tap Space: one small bullet leaves the ship's nose and travels
      straight up at 500 px/s. While it is on screen, pressing or holding
      Space does nothing; once it exits the top edge, Space fires again.
- [ ] Hold Space continuously: bullets fire one after another — each the
      moment the previous one leaves the top — never two on screen at once.
- [ ] The Playing scene opens with exactly 55 invaders in an 11-column ×
      5-row rectangular grid near the top of the canvas: every invader is
      the same filled rectangle in a single colour (drawn with `fillRect`,
      no image assets).
- [ ] The invader formation marches sideways in discrete steps as a single
      unit. When its edge-most invader reaches either side edge of the
      canvas, the whole formation reverses direction and drops by exactly
      one invader cell height, then marches back the other way. (Step
      pacing and the full Level 1 lifecycle are covered by the dedicated
      section below.)
- [ ] Line the ship up under an invader and tap Space: when the bullet
      overlaps the invader's bounding box, both the bullet and that invader
      disappear, a brief explosion (an expanding, fading rectangle, visible
      for ~0.3 s) flashes at the invader's former position, and the HUD
      `Score` increases by 10.
- [ ] Kills are independent: the surviving invaders keep their positions
      and keep marching unchanged, and rapid successive kills can leave
      several explosions visible at once.
- [ ] Auto-repeat neutralised: hold a movement key for several seconds and
      the ship glides smoothly; the OS key-repeat does not make it stutter
      or jump (held state derives from keydown/keyup transitions only — see
      the `event.repeat` guard in `input.js`).
- [ ] Pressing ENTER on the Playing scene moves to the Game Over scene.
      (ENTER is only the manual stand-in end trigger; the wired real
      trigger — lives reaching 0 — is described below and is now driven
      for real by Level 1's breach handling.)
- [ ] Game Over scene shows "GAME OVER", the final score value, and "Press
      ENTER to restart".
- [ ] Pressing ENTER on the Game Over scene returns to the Title scene — no
      page reload or navigation happens at any transition. Starting a new
      game re-centers the ship and restores `Lives: 3`.
- [ ] Browser DevTools console shows no errors and no failed network
      requests throughout the whole flow.

### Level 1: the classic grid

Everything here runs from `file://` with no build step. The console
snippets reuse the live module exports of `game.js`
(`import('./game.js').then((m) => { ... })`); run them only after a game
has started, while `m.currentLevel` is Level 1.

- [ ] Grid spawn: press ENTER on the Title scene — Level 1 starts with
      exactly 55 invaders in an 11-column × 5-row grid above the player
      ship, rendered by the shared formation/sprite code (`invaders.js`),
      and the HUD shows `LEVEL 1` from the first Playing frame
      (`import('./game.js').then((m) => console.log(m.hud.level))` prints
      `1`).
- [ ] March pace: with all 55 invaders alive the formation takes one
      discrete step every ~800 ms — count roughly 10 steps in 8 s. As
      invaders are destroyed the steps come faster, linearly with the
      number left. To watch the top speed without playing for an hour,
      leave a single invader alive from the console:

      ```js
      import('./game.js').then((m) => {
        m.currentLevel.formation.invaders.forEach((v, i) => { v.alive = i === 0; });
      });
      ```

      The survivor now steps every ~100 ms (about 10 steps per second).
- [ ] Edge drop: let the formation march to either canvas edge — the moment
      its edge-most invader reaches the edge, the whole grid drops straight
      down by exactly one invader cell height (32 px: the 24 px invader
      plus the 8 px row gap) and marches back the other way.
- [ ] Life loss + restart on breach: make a few kills first so `Score` is
      non-zero, note `Score` and `Lives`, then push the formation down onto
      the player's row from the console:

      ```js
      import('./game.js').then((m) => {
        m.currentLevel.formation.invaders.forEach((v) => { v.y = 820; });
      });
      ```

      Within a frame the lowest invader's bottom edge reaches the ship's
      row: `Lives` drops by exactly one, the full 55-invader grid respawns
      at its start position and resumes the initial ~800 ms pace, and the
      ship returns to its centered start position. `Score` keeps its value
      and the remaining lives carry over.
- [ ] Level advance: destroy the 55th invader — by playing, or from the
      console:

      ```js
      import('./game.js').then((m) => {
        m.currentLevel.formation.invaders.forEach((v) => { v.alive = false; });
      });
      ```

      Within a frame the level counter increments: the HUD shows `LEVEL 2`
      and `m.hud.level` reads `2`. The handoff goes through the level
      registry (`levels.js` → `createLevel(2, ...)`); until the sibling
      card "Level 2: they shoot back" registers `level2.js`, no module is
      registered for level 2, so the Playing scene simply continues with an
      empty field and the movable ship. Once `level2.js` lands, the same
      registry path creates and starts it — with no change to `level1.js`.
- [ ] Wired game over: set `m.player.lives = 1` in the console, then force
      the breach with the snippet above — losing the last life ends the
      game through the wired lives-reach-0 path and the Game Over scene
      appears with no ENTER involved.

### Verifying the collision wiring by code inspection

The invader-bullet-vs-player half of the collision pass has no on-screen
effect yet — no hostile bullets exist until "Level 2: they shoot back" —
so it is verified by reading the code:

- `game.js` runs the collision pass (`collide({ player, formation:
  currentLevel.formation, hostileBullets, hud })`) exactly once per
  animation frame, after the fixed-timestep world updates and before
  `render()` draws.
- `collision.js` applies its single shared `overlaps()` AABB test to both
  player-bullet-vs-invader and invader-bullet-vs-player, consuming the
  `hostileBullets` list exported from `game.js` (currently always empty).
- No overlap/AABB checks appear inside any draw/render function.

### Verifying the real Game Over trigger (lives reaching 0)

The lives counter is owned by the player ship (`player.lives` in
`player.js`, initialised from `STARTING_LIVES` in `gameConfig.js`);
`game.js` mirrors it into `hud.lives` on every fixed-timestep update and
checks `hud.lives <= 0`. Level 1 now drives this path for real: a
player-row breach calls `player.loseLife()`, and a breach that takes the
last life ends the game (see the Level 1 checklist above). To exercise the
trigger directly by hand:

1. Start a game (ENTER on the Title scene).
2. In the DevTools console run:
   `import('./game.js').then((m) => { m.player.lives = 0; });`
   — or call `m.player.loseLife()` repeatedly; that is the documented
   decrement interface the level cards use.
3. The scene switches to Game Over within a frame, and `Hi` is updated to
   the greater of its previous value and the final score.

Later cards (invader/boss damage) drive this same path via
`player.loseLife()` — which is why `player` (exposing `player.bullet`,
`player.lives`, `player.loseLife()` and `player.resetPosition()`), `hud`
(with the keys `score`, `lives`, `hiScore`, `level`), `hostileBullets` and
`currentLevel` are named exports of `game.js`.

## Planned file layout

Implemented so far:

- `index.html` — canvas page (768×896, dark background, inline styling),
  loads `game.js`.
- `gameConfig.js` — shared constants (`CANVAS_WIDTH`, `CANVAS_HEIGHT`,
  `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES`).
- `input.js` — held-key keyboard tracking (`initInput()`, `isKeyHeld(key)`)
  with auto-repeat neutralised.
- `player.js` — the `Player` ship entity: dt-scaled movement with canvas
  clamping, procedural drawing, the one-bullet rule (`player.bullet`), the
  lives counter (`player.lives`, `player.loseLife()`) and a position-only
  reset (`player.resetPosition()`) for level restarts.
- `invaders.js` — the invader formation (`InvaderFormation`): an 11-column ×
  5-row grid (55 invaders) of identical `fillRect` rectangles, driven in
  discrete steps by the level cards (`step()`: one sideways increment per
  call; when the edge-most living invader reaches a canvas side edge the
  formation snaps flush, reverses direction and drops by exactly one
  invader cell height), plus the `aliveCount()` / `lowestBottom()` queries
  the level lifecycle needs.
- `collision.js` — the shared AABB overlap test (`overlaps()`), the
  per-frame collision pass (`collide()`: player bullet vs invader → both
  removed, explosion spawned, score +10; invader bullet vs player → bullet
  spent, `player.loseLife()`), and the explosion lifecycle
  (`updateExplosions()` / `drawExplosions()` / `clearExplosions()`).
- `levels.js` — the tiny level registry/loader (`registerLevel()`,
  `createLevel()`, `isLevelRegistered()`): a map from level number to level
  factory. Level modules self-register on import, so a new level card adds
  its module without touching `level1.js`.
- `level1.js` — Level 1: the classic grid. Spawns the shared 11 × 5
  formation, marches it in discrete steps whose interval scales linearly
  from ~800 ms (55 alive) down to ~100 ms (1 alive), drops one cell height
  and reverses at the playfield edges, costs the player one life and
  restarts the level in its initial state on a player-row breach, and
  reports `cleared` when the last invader is destroyed.
- `game.js` — fixed-timestep loop (60 steps/s, 250 ms delta cap),
  three-scene ENTER-driven state machine, on-canvas HUD (Score, Lives, Hi,
  LEVEL n); owns the level counter, creates the active level through the
  `levels.js` registry and hands off to the next registered level module on
  a clear; wires `input.js`, `player.js`, `level1.js` and `collision.js`
  into the Playing scene (update world → collide once per frame → draw);
  exports `hud`, `player`, `hostileBullets` and `currentLevel`.

Not yet implemented (owned by sibling cards — do not create these here):

- `level2.js` — Level 2: they shoot back
- `level3.js` — Level 3: shields and formations
- `boss.js` — Boss level: multi-phase finale
