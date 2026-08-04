# Space Invaders

A hand-written, dependency-free Space Invaders clone built with plain HTML5 Canvas and ES modules.

## File Layout

| File | Description |
|------|-------------|
| `index.html` | Entry point — open this file directly in a browser |
| `game.js` | Game loop, scene state machine (Title / Playing / Game Over), HUD renderer, `hud` export, `switchScene` export |
| `gameConfig.js` | Shared constants: `CANVAS_WIDTH`, `CANVAS_HEIGHT`, `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES`, invader layout constants, `SCORE_PER_KILL`, `EXPLOSION_DURATION_MS` |
| `input.js` | Keyboard handling — `initInput()` registers listeners, `isKeyHeld(key)` queries held-key state |
| `player.js` | Player ship — movement, bullet, procedural canvas rendering, `Player` class |
| `invaders.js` | Invader grid — 11×5 formation (55 invaders), horizontal march with edge-drop and direction reversal, explosion flash effects, `InvaderGrid` class |
| `collision.js` | Collision detection — `checkBulletInvaderCollisions(bullet, grid)` AABB pass; `checkInvaderBulletPlayerCollision(invaderBullet, player)` stub |

## How to Play

1. Open `index.html` directly in a modern browser (Chrome, Firefox, Edge).
   - No server required — the game runs from `file://` without any build step.
2. Press **Enter** on the Title screen to start.
3. Use **Arrow Left / Arrow Right** (or **A / D**) to move your ship.
4. Press **Space** to fire.
5. Shoot all invaders to clear the screen.

## Controls

| Key | Action |
|-----|--------|
| Arrow Left / A | Move left |
| Arrow Right / D | Move right |
| Space | Fire |
| Enter | Start / Restart |

## Game Flow

```
Title → Playing → Game Over → Title
```

- **Title**: Displays "SPACE INVADERS" and "Press ENTER to start". Press ENTER to begin.
- **Playing**: HUD shows score and lives. 11×5 invader grid moves and can be shot.
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
   - The HUD (`SCORE  0` top-left, `HI  0` top-centre, `LIVES  3` top-right).
   - The player ship (green) at the bottom of the canvas.
   - The invader grid: **11 columns × 5 rows = 55 cyan filled rectangles** arranged in a formation near the top of the play area.
3. No page reload should occur.

### 4. Grid rendering — 55 invaders
1. After pressing ENTER, count the rectangles in the formation.
2. **Expected:** 11 columns × 5 rows = **55 filled rectangles**, all the same colour and size.
3. Open DevTools Console and run:
   ```js
   import('./invaders.js').then(m => {
     const g = new m.InvaderGrid();
     const total = g.invaders.flat().length;
     console.log('Total invaders:', total); // must print 55
     console.log('All alive at start:', g.invaders.flat().every(i => i.alive)); // true
   });
   ```

### 5. Formation movement
1. Watch the invader formation on the Playing scene.
2. **Expected:** The entire grid moves **sideways as a unit** each frame.
3. When the rightmost invader reaches the right canvas edge (or leftmost reaches the left edge):
   - The formation **drops downward** by a fixed increment.
   - The horizontal direction **reverses** (right → left or left → right).
4. This pattern repeats continuously.

### 6. Speed multiplier
1. Open DevTools Console while on the Playing scene and run:
   ```js
   import('./invaders.js').then(m => {
     const slow = new m.InvaderGrid({ speedMultiplier: 1 });
     const fast = new m.InvaderGrid({ speedMultiplier: 2 });
     console.log('slow speed:', slow.speed); // e.g. 60
     console.log('fast speed:', fast.speed); // e.g. 120 — twice as fast
   });
   ```
2. **Expected:** `fast.speed` is exactly double `slow.speed`.

### 7. Shooting and collision
1. Move the ship with arrow keys and press **Space** to fire.
2. A yellow bullet travels upward.
3. **Expected when the bullet hits an invader:**
   - The invader **disappears immediately** (it is removed from the live set).
   - An **orange/yellow flash rectangle** briefly appears at the destroyed invader's position and fades within 300 ms.
   - The bullet is consumed (disappears).
   - The **SCORE counter increments** (top-left HUD) by the configured points value.

### 8. Score HUD
1. Fire at and destroy several invaders.
2. **Expected:** The `SCORE` value in the top-left HUD increases each time an invader is destroyed.
3. The score is drawn **every frame** — it updates without any interaction beyond shooting.

### 9. Explosion effect
1. Shoot an invader and watch the hit position.
2. **Expected:** A brief expanding coloured rectangle (no external images) appears at the invader's location.
3. The flash disappears within **300 ms** (configurable via `EXPLOSION_DURATION_MS` in `gameConfig.js`).
4. After the flash disappears, nothing is drawn at that position — the invader is gone.

### 10. Collision pass order (code inspection)
1. Open `game.js` and locate `updatePlaying(dt)`.
2. **Expected order inside that function:**
   1. `player.update(dt)` — move player/bullet.
   2. `grid.update(dt)` — move invaders.
   3. `checkBulletInvaderCollisions(...)` — **collision pass**.
3. Open `invaders.js` and confirm `draw()` contains **no calls** to `checkBulletInvaderCollisions` or any scoring logic.

### 11. allDefeated()
1. Open DevTools Console and run:
   ```js
   import('./invaders.js').then(m => {
     const g = new m.InvaderGrid();
     console.log('allDefeated at start:', g.allDefeated()); // false
     g.invaders.flat().forEach(i => { i.alive = false; });
     console.log('allDefeated after clearing:', g.allDefeated()); // true
   });
   ```
2. **Expected:** `false` initially, `true` after all invaders are marked defeated.

### 12. Invader-bullet collision stub
1. Open DevTools Console and run:
   ```js
   import('./collision.js').then(m => {
     console.log(typeof m.checkInvaderBulletPlayerCollision); // 'function'
     const result = m.checkInvaderBulletPlayerCollision(null, { x: 0, y: 0 });
     console.log(result); // { hit: false }
   });
   ```
2. **Expected:** The function exists, accepts the two parameters, and returns `{ hit: false }` as a no-op.

### 13. Tab-backgrounding delta-cap
1. Start the game (reach the Playing scene).
2. Switch away from the tab for ~5 seconds.
3. Switch back.
4. **Expected:** The game resumes normally without any stutter or burst of update steps.

### 14. Exported API spot-check (DevTools console)
Open DevTools and run:
```js
import('./game.js').then(m => {
  console.log(m.hud);                    // { score: 0, lives: 3, hiScore: 0 }
  console.log(typeof m.switchScene);     // 'function'
  console.log(typeof m.renderHUD);       // 'function'
});
```
All three should resolve without errors.

---

## Architecture Notes

- **Fixed timestep:** The game loop accumulates elapsed time and fires update steps at exactly 1000/60 ms (≈16.67 ms) each. The accumulated delta is capped at 200 ms so returning from a backgrounded tab never triggers a burst of catch-up updates.
- **Scene machine:** `switchScene('Title' | 'Playing' | 'GameOver')` is the only way to change scenes.
- **Collision before draw:** `checkBulletInvaderCollisions` is called inside `updatePlaying()`, which always runs before `drawPlaying()`. No collision logic exists inside any `draw()` method.
- **HUD contract:** `hud.score`, `hud.lives`, and `hud.hiScore` are plain mutable properties. The score is incremented in `updatePlaying()` and rendered in `renderHUD()` every frame.
- **No bundler, no server:** Every import uses a relative path. The game works from `file://` in any browser that supports ES modules (Chrome 61+, Firefox 60+, Edge 79+).
