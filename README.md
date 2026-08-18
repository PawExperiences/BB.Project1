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
      itself; no gameplay entities are present yet (expected — not
      implemented in this card).
- [ ] Pressing ENTER on the Playing scene moves to the Game Over scene.
      (ENTER is only the manual stand-in end trigger for this card; the
      wired real trigger is described below.)
- [ ] Game Over scene shows "GAME OVER", the final score value, and "Press
      ENTER to restart".
- [ ] Pressing ENTER on the Game Over scene returns to the Title scene — no
      page reload or navigation happens at any transition.
- [ ] Browser DevTools console shows no errors and no failed network
      requests throughout the whole flow.

### Verifying the real Game Over trigger (lives reaching 0)

This card ships no gameplay that reduces lives, but the Playing → Game Over
transition is wired to the exported HUD state: `game.js` checks
`hud.lives <= 0` on every fixed-timestep update. To exercise it by hand:

1. Start a game (ENTER on the Title scene).
2. In the DevTools console run:
   `import('./game.js').then((m) => { m.hud.lives = 0; });`
3. The scene switches to Game Over within a frame, and `Hi` is updated to
   the greater of its previous value and the final score.

Later cards (invader/boss damage) drive this same path for real — which is
why `hud` (with exactly the keys `score`, `lives`, `hiScore`) is a named
export of `game.js` owned by this card.

## Planned file layout

Implemented in this card:

- `index.html` — canvas page (768×896, dark background, inline styling),
  loads `game.js`.
- `gameConfig.js` — shared constants (`CANVAS_WIDTH`, `CANVAS_HEIGHT`,
  `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES`).
- `game.js` — fixed-timestep loop (60 steps/s, 250 ms delta cap),
  three-scene ENTER-driven state machine, on-canvas HUD; exports `hud`.

Not yet implemented (owned by sibling cards — do not create these here):

- `input.js` — Keyboard input and the player ship
- `player.js` — Keyboard input and the player ship
- `collision.js` — Sprite rendering and collision detection
- `invaders.js` — Level 1: the classic grid
- `level1.js` — Level 1: the classic grid
- `level2.js` — Level 2: they shoot back
- `level3.js` — Level 3: shields and formations
- `boss.js` — Boss level: multi-phase finale
