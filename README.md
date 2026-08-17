# BB.Project1 — Space Invaders

A hand-written HTML/CSS/ES-modules Space Invaders clone. No framework, no
bundler, no package manager.

## Running the game

Open `index.html` directly in a browser (double-click it, or open the
`file://` path). There is no build step, no dev server, and nothing to
install — the page loads `game.js` as an ES module and runs.

## Environment note

No build tooling exists in this repo today. If future cards introduce one,
the assumed environment is **Node 20 LTS** with **pnpm** as the package
manager. Until then, none of that is required to run or verify the game.

## Manual verification checklist

Open `index.html` via a `file://` URL and check:

- [ ] Title scene shows "SPACE INVADERS" and "Press ENTER to start", canvas
      is 768×896 on a dark background.
- [ ] Pressing ENTER on the Title scene moves to the Playing scene.
- [ ] Playing scene shows the HUD (Score, Lives, Hi) on the canvas; no
      gameplay entities are present yet (expected — not implemented in this
      card).
- [ ] Pressing ENTER on the Playing scene moves to the Game Over scene.
- [ ] Game Over scene shows "GAME OVER", the final score, and "Press ENTER
      to restart".
- [ ] Pressing ENTER on the Game Over scene returns to the Title scene (no
      page reload/navigation happens at any transition).
- [ ] Browser DevTools console shows no errors or failed requests throughout
      the whole flow.

## Planned file layout

Implemented in this card:

- `index.html` — canvas page, loads `game.js`.
- `gameConfig.js` — shared constants.
- `game.js` — fixed-timestep loop, scene state machine, HUD.

Not yet implemented (owned by sibling cards):

- `input.js` — Keyboard input and the player ship
- `player.js` — Keyboard input and the player ship
- `collision.js` — Sprite rendering and collision detection
- `invaders.js` — Level 1: the classic grid
- `level1.js` — Level 1: the classic grid
- `level2.js` — Level 2: they shoot back
- `level3.js` — Level 3: shields and formations
- `boss.js` — Boss level: multi-phase finale
