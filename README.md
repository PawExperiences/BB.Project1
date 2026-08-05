# Space Invaders — e2e Project

A hand-written, dependency-free Space Invaders clone built with plain HTML, CSS, and ES modules.

## How to Play

1. Open `index.html` directly in a modern browser (Chrome, Firefox, Edge).
   - No local server required — the game works from a `file://` URL.
   - No build step, no npm, no bundler.
2. Press **ENTER** on the title screen to start.
3. Move with **Arrow Left / Arrow Right** (or **A / D**).
4. Fire with **Space**.
5. Destroy all invaders to advance to the next level.
6. If an invader reaches the bottom or you lose all lives, it's game over.

## Levels

| Level | Description |
|-------|-------------|
| 1     | Classic 11 × 5 invader grid. Sweep-and-drop formation. |
| 2     | Same grid with invader return fire and a bonus UFO. |
| 3     | Destructible shield bunkers + formation split at half-kills. |

---

## Manual Verification Steps

### Level 1

1. Press ENTER on the title screen.
2. Confirm a 5-row × 11-column grid of green invaders is visible.
3. Watch the formation sweep left-right and drop one row each time it reaches a canvas edge.
4. Shoot all invaders — confirm the game transitions to Level 2 (HUD shows "LEVEL 2").
5. Let the formation reach the bottom — confirm GAME OVER is shown.

### Level 2

1. Complete Level 1 to reach Level 2.
2. Confirm the 5 × 11 grid resets and the HUD shows "LEVEL 2".
3. Observe red invader bullets firing downward at the player.
4. Let a bullet hit the player ship — confirm a life is lost and the ship flashes.
5. Shoot all invaders — confirm the game transitions to Level 3 (HUD shows "LEVEL 3").

### Level 3 — Shield Bunker Erosion

1. Complete Levels 1 and 2 to reach Level 3 (or temporarily modify `game.js` to start at Level 3
   by calling `onLevel2Complete()` from the ENTER handler for faster testing).
2. Confirm **four green rectangular bunkers** are visible approximately 80% of the way down
   the canvas, evenly spaced horizontally.
3. Each bunker is a **4 × 4 grid of small (~8 px) solid green cells**.
4. Fire a player bullet into a bunker:
   - **Expected:** exactly the cell struck disappears; the rest of the bunker remains intact.
   - **Expected:** the bullet is destroyed on impact and does not pass through.
5. Fire multiple bullets at the same bunker to erode it cell by cell:
   - After 16 hits the bunker is completely gone and no longer rendered.
6. Wait for invader bullets to strike a bunker:
   - **Expected:** each invader bullet that hits a bunker cell removes that cell and the bullet
     is absorbed (does not continue to the player).
7. Confirm that a fully destroyed bunker (all 16 cells gone) no longer appears on screen and
   no longer blocks any bullets.

### Level 3 — Formation Split

1. Start Level 3 (see step 1 above).
2. Destroy invaders one by one, keeping count.
3. At the **28th kill** (i.e. once 28 invaders have been destroyed, leaving 27 survivors),
   observe the formation:
   - **Expected:** the remaining invaders split visually into two separate groups.
   - The **left group** (original columns 0 – 5) begins sweeping in one direction.
   - The **right group** (original columns 6 – 10) begins sweeping in the opposite direction.
4. Confirm each group sweeps independently across the full canvas width, reversing and
   dropping one row when it hits either canvas edge — exactly as the unified formation did.
5. Confirm that only surviving invaders appear in each group (dead invaders do not reappear).
6. Confirm the split happens **only once** — destroying further invaders does not cause
   additional splits or resets.
7. Confirm each group continues to fire red bullets downward at the player after the split.

### Level 3 — Win / Lose Conditions

- **Win:** destroy all 55 invaders → HUD shows "LEVEL COMPLETE!" screen.
- **Lose (breach):** allow the invader formation (or either post-split group) to descend to
  the bunker line (≈ 80% canvas height) → GAME OVER screen appears.
- **Lose (player death):** let invader bullets deplete all lives → GAME OVER screen appears.

---

## File Structure

```
index.html       — Entry point; loads game.js as a module
game.js          — Game loop, scene state machine, HUD
gameConfig.js    — Shared constants (canvas size, speeds, lives)
player.js        — Player ship entity
invaders.js      — Invader formation state and rendering
collision.js     — AABB collision detection
explosion.js     — Explosion visual effect
input.js         — Keyboard input
level1.js        — Level 1 logic
level2.js        — Level 2 logic (invader fire, UFO)
level3.js        — Level 3 logic (shields, formation split)
```
