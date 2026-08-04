# Space Invaders

A hand-written, dependency-free Space Invaders clone built with plain HTML5 Canvas and ES modules.

## File Layout

| File | Description |
|------|-------------|
| `index.html` | Entry point — open this file directly in a browser |
| `game.js` | Game loop, scene state machine (Title / Playing / Game Over), HUD renderer, `hud` export, `switchScene` export |
| `gameConfig.js` | Shared constants: `CANVAS_WIDTH`, `CANVAS_HEIGHT`, `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES`, invader layout constants, `SCORE_PER_KILL`, `EXPLOSION_DURATION_MS`, bunker constants |
| `input.js` | Keyboard handling — `initInput()` registers listeners, `isKeyHeld(key)` queries held-key state |
| `player.js` | Player ship — movement, bullet, procedural canvas rendering, `Player` class |
| `invaders.js` | Invader grid — `InvaderGrid` (11×5 formation), `SplitInvaderGrid` (Level 3 with formation split) |
| `shields.js` | Level 3 shield bunkers — `ShieldManager` class, four 4×4 cell bunkers, `reset()` method |
| `collision.js` | Collision detection — `checkBulletInvaderCollisions`, `checkInvaderBulletPlayerCollision`, `checkBulletBunkerCollisions` |

## How to Play

1. Open `index.html` directly in a modern browser (Chrome, Firefox, Edge).
   - No server required — the game runs from `file://` without any build step.
2. Press **Enter** on the Title screen to start.
3. Use **Arrow Left / Arrow Right** (or **A / D**) to move your ship.
4. Press **Space** to fire.
5. Shoot all invaders to advance through the levels.

## Controls

| Key | Action |
|-----|--------|
| Arrow Left / A | Move left |
| Arrow Right / D | Move right |
| Space | Fire |
| Enter | Start / Restart |

## Game Flow

```
Title → Playing (Level 1) → Playing (Level 2) → Playing (Level 3) → Game Over → Title
```

- **Title**: Displays "SPACE INVADERS" and "Press ENTER to start". Press ENTER to begin.
- **Playing**: HUD shows score, hi-score, lives, and current level number. Invader grid moves and can be shot.
- **Game Over**: Displays "GAME OVER" and the final score. Press ENTER to return to Title.

---

## Manual Verification Walkthrough

### 1. Open the game
1. Locate `index.html` in the project folder.
2. Double-click it, or drag it into Chrome or Firefox.
3. **Expected:** A 768×896 black canvas appears centred on the page. No console errors.

### 2. Title scene
1. The canvas should display **"SPACE INVADERS"** in large green text.
2. **"Press ENTER to start"** should be visible (it blinks).
3. Open DevTools → Console and confirm **no errors**.

### 3. Title → Playing transition
1. Press **ENTER**.
2. **Expected:** The canvas clears and shows:
   - The HUD (`SCORE  0` top-left, `HI  0` top-centre, `LIVES  3` top-right, `LEVEL  1` below centre).
   - The player ship (green) at the bottom of the canvas.
   - The invader grid: **11 columns × 5 rows = 55 cyan filled rectangles** arranged near the top.
3. No page reload should occur.

### 4. Grid rendering — 55 invaders
1. After pressing ENTER, count the rectangles in the formation.
2. **Expected:** 11 columns × 5 rows = **55 filled rectangles**, all the same colour and size.

### 5. Formation movement
1. Watch the invader formation on the Playing scene.
2. **Expected:** The entire grid moves **sideways as a unit**.
3. When an edge is reached, the formation **drops downward** and **reverses direction**.

### 6. Shooting and collision
1. Move the ship and press **Space** to fire.
2. A yellow bullet travels upward.
3. **Expected when the bullet hits an invader:**
   - The invader disappears immediately.
   - An orange/yellow flash briefly appears at the destroyed position.
   - The bullet is consumed.
   - The **SCORE counter increments**.

### 7. Level progression
1. Destroy all 55 invaders on Level 1.
2. **Expected:** The game immediately transitions to Level 2. HUD shows `LEVEL  2`.
3. On Level 2, invaders fire downward red bullets. A magenta UFO periodically crosses the top.
4. Destroy all invaders on Level 2.
5. **Expected:** Transition to Level 3. HUD shows `LEVEL  3`.

### 8. allDefeated() and split grid
1. Open DevTools Console and run:
   ```js
   import('./invaders.js').then(m => {
     const g = new m.SplitInvaderGrid();
     console.log('allDefeated at start:', g.allDefeated()); // false
     g.invaders.flat().forEach(i => { i.alive = false; });
     console.log('allDefeated after clearing:', g.allDefeated()); // true
   });
   ```
2. **Expected:** `false` initially, `true` after all invaders marked defeated.

---

## Level 3 Manual Verification Steps

### L3-1. Shield bunkers appear
1. Clear Levels 1 and 2 to reach Level 3 (or temporarily force `hud.level = 3` in DevTools).
2. **Expected:** Four green rectangular bunker formations appear at approximately **80% of canvas height** (about 716 px from the top on a 896 px canvas), evenly spaced across the canvas width.
3. Each bunker should appear as a **4×4 grid of ~8 px solid-green squares** — 16 cells per bunker.

### L3-2. Player bullet erodes bunker cells
1. On Level 3, fire the player bullet into one of the four green bunkers.
2. **Expected:**
   - The bullet stops at the bunker.
   - On the very next frame, the **exact cell** the bullet struck is visually gone (a missing square in the grid).
   - Surrounding cells are unaffected.
3. Repeat: fire multiple shots at the same bunker.
4. **Expected:** Each hit removes exactly one cell. After 16 hits on a single bunker, the entire bunker disappears.

### L3-3. Invader bullet erodes bunker cells
1. On Level 3, allow invader bullets (red) to travel downward and strike a bunker.
2. **Expected:**
   - The invader bullet stops at the bunker.
   - The struck cell is removed on the next frame.
3. **Bunkers block both directions of fire.**

### L3-4. Fully destroyed bunker disappears
1. Fire 16 shots into a single bunker until all cells are removed.
2. **Expected:** The bunker is no longer rendered and no longer blocks bullets.

### L3-5. Bunker state resets at Level 3 start
1. Play Level 3, erode some bunker cells, then lose a life (let invaders reach the ship).
2. **Expected:** When Level 3 restarts after the life loss, all four bunkers are **fully restored** with 16 cells each.
   *(Note: losing the last life ends the game; restart means re-entering Level 3 with at least 1 life.)*

### L3-6. Formation split at 50% kill threshold
1. On Level 3, count the starting invader total (**55**).
2. **Threshold:** ⌊55/2⌋ = **27 kills**.
3. Destroy exactly 27 invaders.
4. **Expected immediately after the 27th kill:**
   - The surviving invaders visually **split** into two independent groups:
     - **Left group** (columns 0–4) begins sweeping **leftward**.
     - **Right group** (columns 5–10) begins sweeping **rightward**.
   - Both groups continue the standard edge-drop and direction-reversal behaviour, but **independently** of each other.

### L3-7. Opposite initial directions after split
1. Watch the two halves immediately after the split.
2. **Expected:** The left group moves toward the left edge first; the right group moves toward the right edge first.
   (They do NOT both move in the same direction.)

### L3-8. Post-split speed unchanged
1. Compare the step timing of the formation just before the 27th kill vs. just after the split.
2. **Expected:** The speed of each half matches the pre-split formation speed. No sudden acceleration or deceleration at the moment of split.

### L3-9. Independent half destruction
1. After the split, focus fire on one half and destroy all invaders in it.
2. **Expected:** The other half continues sweeping independently without interruption.
3. `allDefeated()` returns `false` while the surviving half still has alive invaders.

### L3-10. Split is a one-time event
1. During a Level 3 session, verify the split only happens once.
2. **Expected:** After the split occurs at 27 kills, further kills do **not** cause a second split of either half.

### L3-11. Level 3 win condition
1. After the split, destroy all surviving invaders in both halves.
2. **Expected:** The game advances to Game Over (boss level not yet implemented).

### L3-12. Collision detection — code inspection
1. Open `collision.js` and verify:
   - `checkBulletBunkerCollisions(bullet, bulletW, bulletH, shieldManager)` exists.
   - It iterates `shieldManager.bunkers` → `bunker.cells` → individual cells.
   - On a hit, `cell.alive` is set to `false` and the function returns `{ hit: true, ... }`.
2. Open `game.js` and verify `checkBulletBunkerCollisions` is called for both player bullets and invader bullets during Level 3's update pass.

---

## Architecture Notes

- **Fixed timestep:** The game loop accumulates elapsed time and fires update steps at exactly 1000/60 ms (≈16.67 ms) each. The accumulated delta is capped at 200 ms so returning from a backgrounded tab never triggers a burst of catch-up updates.
- **Scene machine:** `switchScene('Title' | 'Playing' | 'GameOver')` is the only way to change scenes.
- **Collision before draw:** All collision functions are called inside `updatePlaying()`, which always runs before `renderPlaying()`. No collision logic exists inside any `draw()` method.
- **HUD contract:** `hud.score`, `hud.lives`, `hud.hiScore`, and `hud.level` are plain mutable properties.
- **No bundler, no server:** Every import uses a relative path. The game works from `file://` in any browser that supports ES modules (Chrome 61+, Firefox 60+, Edge 79+).
- **Shield bunkers (Level 3):** `ShieldManager` owns bunker state. `checkBulletBunkerCollisions` in `collision.js` handles AABB per-cell detection. Bunkers reset via `ShieldManager.reset()` at the start of each Level 3 session.
- **Formation split (Level 3):** `SplitInvaderGrid` extends `InvaderGrid`. On `maybeSplit()` the formation is divided at the middle column into two `InvaderHalf` instances that sweep independently. `allDefeated()` requires both halves cleared.
