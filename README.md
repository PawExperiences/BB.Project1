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
- [ ] Playing scene shows the HUD (Score, Lives, Hi) drawn on the canvas
      itself, plus the player ship near the bottom edge: a small green
      cannon/hull/dome shape, horizontally centered.
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
- [ ] The invader formation drifts sideways as a single unit. When its
      edge-most invader reaches either side edge of the canvas, the whole
      formation reverses direction and drops one visible step downward,
      then marches back the other way.
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
      (ENTER is only the manual stand-in end trigger for now; the wired
      real trigger is described below.)
- [ ] Game Over scene shows "GAME OVER", the final score value, and "Press
      ENTER to restart".
- [ ] Pressing ENTER on the Game Over scene returns to the Title scene — no
      page reload or navigation happens at any transition. Starting a new
      game re-centers the ship and restores `Lives: 3`.
- [ ] Browser DevTools console shows no errors and no failed network
      requests throughout the whole flow.

### Verifying the collision wiring by code inspection

The invader-bullet-vs-player half of the collision pass has no on-screen
effect yet — no hostile bullets exist until "Level 2: they shoot back" —
so it is verified by reading the code:

- `game.js` runs the collision pass (`collide({ player, formation,
  hostileBullets, hud })`) exactly once per animation frame, after the
  fixed-timestep world updates and before `render()` draws.
- `collision.js` applies its single shared `overlaps()` AABB test to both
  player-bullet-vs-invader and invader-bullet-vs-player, consuming the
  `hostileBullets` list exported from `game.js` (currently always empty).
- No overlap/AABB checks appear inside any draw/render function.

### Verifying the real Game Over trigger (lives reaching 0)

The lives counter is owned by the player ship (`player.lives` in
`player.js`, initialised from `STARTING_LIVES` in `gameConfig.js`);
`game.js` mirrors it into `hud.lives` on every fixed-timestep update and
checks `hud.lives <= 0`. To exercise the trigger by hand:

1. Start a game (ENTER on the Title scene).
2. In the DevTools console run:
   `import('./game.js').then((m) => { m.player.lives = 0; });`
   — or call `m.player.loseLife()` repeatedly; that is the documented
   decrement interface the level cards will use.
3. The scene switches to Game Over within a frame, and `Hi` is updated to
   the greater of its previous value and the final score.

Later cards (invader/boss damage) drive this same path for real via
`player.loseLife()` — which is why `player` (exposing `player.bullet` and
`player.lives`) and `hud` (with exactly the keys `score`, `lives`,
`hiScore`) are named exports of `game.js`.

## Planned file layout

Implemented so far:

- `index.html` — canvas page (768×896, dark background, inline styling),
  loads `game.js`.
- `gameConfig.js` — shared constants (`CANVAS_WIDTH`, `CANVAS_HEIGHT`,
  `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES`).
- `input.js` — held-key keyboard tracking (`initInput()`, `isKeyHeld(key)`)
  with auto-repeat neutralised.
- `player.js` — the `Player` ship entity: dt-scaled movement with canvas
  clamping, procedural drawing, the one-bullet rule (`player.bullet`) and
  the lives counter (`player.lives`, `player.loseLife()`).
- `invaders.js` — the invader formation (`InvaderFormation`): an 11-column ×
  5-row grid (55 invaders) of identical `fillRect` rectangles that marches
  sideways as a unit, reversing direction and dropping one step whenever
  its edge-most living invader reaches a canvas side edge.
- `collision.js` — the shared AABB overlap test (`overlaps()`), the
  per-frame collision pass (`collide()`: player bullet vs invader → both
  removed, explosion spawned, score +10; invader bullet vs player → bullet
  spent, `player.loseLife()`), and the explosion lifecycle
  (`updateExplosions()` / `drawExplosions()` / `clearExplosions()`).
- `game.js` — fixed-timestep loop (60 steps/s, 250 ms delta cap),
  three-scene ENTER-driven state machine, on-canvas HUD; wires `input.js`,
  `player.js`, `invaders.js` and `collision.js` into the Playing scene
  (update world → collide once per frame → draw); exports `hud`, `player`
  and `hostileBullets` (the game state's hostile-bullet list, empty until
  "Level 2: they shoot back").

Not yet implemented (owned by sibling cards — do not create these here):

- `level1.js` — Level 1: the classic grid
- `level2.js` — Level 2: they shoot back
- `level3.js` — Level 3: shields and formations
- `boss.js` — Boss level: multi-phase finale
