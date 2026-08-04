# Space Invaders

A hand-written, dependency-free Space Invaders clone built with plain HTML5 Canvas and ES modules.

## File Layout

| File | Description |
|------|-------------|
| `index.html` | Entry point — open this file directly in a browser |
| `game.js` | Game loop, scene state machine (Menu / Level 1–3 / Boss / Win / Game Over), HUD renderer, `hud` export, `switchScene` export |
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
6. After Level 3, face the **Boss** — a multi-phase encounter. Survive and win!

## Controls

| Key | Action |
|-----|--------|
| Arrow Left / A | Move left |
| Arrow Right / D | Move right |
| Space | Fire |
| Enter | Start / Restart |

## Game Flow

```
Menu → Level 1 → Level 2 → Level 3 → Boss → Win
                                          ↓ (hit by boss bullet)
                                         Menu
```

- **Menu**: Displays "SPACE INVADERS" and "Press ENTER to start". Press ENTER to begin.
- **Level 1–3**: HUD shows score, hi-score, lives, and current level number.
- **Boss**: Single large boss with 10 HP. Two phases — Phase 1 fires every 2 s, Phase 2 (≤5 HP) fires every 1 s and turns red. Any boss bullet = instant death → Menu.
- **Win**: Displayed when boss is defeated. Shows final score. Press ENTER to return to Menu.
- **Game Over**: Displayed when lives reach 0. Press ENTER to return to Menu.

---

## Manual Verification Walkthrough

### 1. Open the game
1. Locate `index.html` in the project folder.
2. Double-click it, or drag it into Chrome or Firefox.
3. **Expected:** A 768×896 black canvas appears centred on the page. No console errors.

### 2. Title / Menu scene
1. The canvas should display **"SPACE INVADERS"** in large green text.
2. **"Press ENTER to start"** should be visible (it blinks).
3. Open DevTools → Console and confirm **no errors**.

### 3. Level progression
1. Press **ENTER** to start.
2. Play through Levels 1, 2, and 3 (or use DevTools to accelerate).
3. After destroying all invaders on Level 3, the game transitions to the **Boss** scene.
4. **Expected:** HUD shows `LEVEL  4`. A large grey boss entity appears in the upper portion of the canvas. A health bar is visible below the boss showing `HP  10 / 10`.

### 4. Boss Phase 1
1. Let the boss fire. You should see aimed orange/red bullets travel downward toward your ship every ~2 seconds.
2. Fire player bullets at the boss to reduce its HP. Each hit decrements the health bar by 1/10.
3. **Expected during Phase 1 (HP 10–6):** Boss is grey. Bullets fire every 2 s.

### 5. Boss Phase 2 transition
1. Hit the boss until HP drops to 5.
2. **Expected immediately:** The boss colour changes from grey to red. Bullets now fire every 1 s.
3. The health bar foreground changes colour to indicate danger.

### 6. Sudden-death (boss bullet hits player)
1. Allow a boss bullet to hit the player ship.
2. **Expected:** The game immediately transitions to the **Menu** scene (not Level 1).
3. No stale boss bullets should be visible on the Menu screen.

### 7. Win condition
1. Reduce the boss HP to 0.
2. **Expected:** The game transitions to the **Win** scene.
3. The Win scene displays **"YOU WIN!"**, the **FINAL SCORE** accumulated across all levels, and **"Press ENTER to return to Menu"** (blinking).
4. Press ENTER — the game returns to the **Menu** scene.

### 8. Level 1–3 regression
All previously documented Level 1–3 steps remain valid. Refer to the sections below.

---

## Level 1–3 Manual Verification Steps

### L1/L2: Basic gameplay
1. Destroy all invaders on Level 1 → transitions to Level 2. HUD shows `LEVEL  2`.
2. On Level 2, invaders fire downward red bullets. A magenta UFO periodically crosses the top.
3. Destroy all invaders on Level 2 → transitions to Level 3. HUD shows `LEVEL  3`.

### L3-1. Shield bunkers appear
1. Reach Level 3.
2. **Expected:** Four green rectangular bunker formations appear at ~80% of canvas height.

### L3-2. Player bullet erodes bunker cells
1. Fire into a bunker. **Expected:** The bullet stops and the cell disappears.

### L3-3. Invader bullet erodes bunker cells
1. Let invader bullets hit bunkers. **Expected:** Cells are removed.

### L3-4. Formation split at 50% kill threshold
1. Destroy 27 invaders. **Expected:** Survivors split into two independent halves.

### L3-5. Level 3 win condition
1. Destroy all invaders. **Expected:** Game advances to Boss scene.

---

## Architecture Notes

- **Fixed timestep:** 1000/60 ms steps; 250 ms delta cap.
- **Scene machine:** `switchScene('menu' | 'level1' | 'level2' | 'level3' | 'boss' | 'win' | 'gameover')`.
- **Collision before draw:** All collision functions run inside `update()`, never inside `draw()`.
- **HUD contract:** `hud.score`, `hud.lives`, `hud.hiScore`, `hud.level` are plain mutable properties.
- **No bundler, no server:** Works from `file://` in any ES-module-capable browser.
- **Boss scene:** `BossScene` uses canvas primitives only; boss is 120×60 px centred horizontally. Bullets cleared in `destroy()` to prevent stale projectiles.
- **Win scene:** `WinScene` captures `hud.score` at construction time and displays it as the final score.
