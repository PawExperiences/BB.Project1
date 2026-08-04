# Space Invaders

A hand-written, dependency-free Space Invaders clone built with plain HTML5 Canvas and ES modules.

## File Layout

| File | Description |
|------|-------------|
| `index.html` | Entry point — open this file directly in a browser |
| `game.js` | Game loop, scene state machine (Title / Playing / Game Over), HUD renderer, `hud` export, `switchScene` export |
| `gameConfig.js` | Shared constants: `CANVAS_WIDTH`, `CANVAS_HEIGHT`, `PLAYER_SPEED`, `BULLET_SPEED`, `STARTING_LIVES` |
| `input.js` | Keyboard handling — `initInput()` registers listeners, `isKeyHeld(key)` queries held-key state |
| `player.js` | Player ship — movement, bullet, procedural canvas rendering, `Player` class |
| `invaders.js` | Invader grid — 11×5 formation, march logic, procedural rendering, `InvaderGrid` class |
| `collision.js` | Collision detection — `checkBulletInvaderCollisions(bullet, grid)` AABB pass |

## How to Play

1. Open `index.html` directly in a modern browser (Chrome, Firefox, Edge).
   - No server required — the game runs from `file://` without any build step.
2. Press **Enter** on the Title screen to start.
3. Use **Arrow Left / Arrow Right** (or **A / D**) to move your ship.
4. Press **Space** to fire.
5. Defeat all invaders to advance through the levels.

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
- **Playing**: HUD shows score and lives. Full gameplay implemented by later cards.
- **Game Over**: Displays "GAME OVER" and the final score. Press ENTER to return to Title.

---

## Manual Verification Walkthrough

These steps verify the game loop and canvas framework (this card's scope).

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
2. **Expected:** The canvas clears and shows the HUD (score and lives at the top) plus a placeholder message.
3. No page reload should occur (URL stays the same, no flicker).

### 4. Playing scene HUD
1. While on the Playing scene, confirm the top of the canvas shows:
   - `SCORE  0` on the left.
   - `HI  0` in the centre.
   - `LIVES  3` on the right.
2. A thin divider line separates the HUD from the play area.

### 5. Playing → Game Over transition
1. From the Playing scene, press **ENTER** (stub shortcut).
2. **Expected:** The canvas clears and shows:
   - **"GAME OVER"** in large red text.
   - **`SCORE  0`** (or the current score value).
   - **"Press ENTER to restart"** (blinking).

### 6. Game Over → Title transition
1. From the Game Over scene, press **ENTER**.
2. **Expected:** Returns to the Title scene — "SPACE INVADERS" and "Press ENTER to start" are shown again.
3. No page reload. Score resets to 0.

### 7. Tab-backgrounding delta-cap
1. Start the game (reach the Playing scene).
2. Switch away from the tab for ~5 seconds.
3. Switch back.
4. **Expected:** The game resumes normally without any stutter or burst of update steps. The loop's 200 ms delta cap prevents accumulated catch-up updates.

### 8. Exported API spot-check (DevTools console)
Open DevTools and run:
```js
import('./game.js').then(m => {
  console.log(m.hud);          // { score: 0, lives: 3, hiScore: 0 }
  console.log(typeof m.switchScene);   // 'function'
  console.log(typeof m.renderHUD);     // 'function'
});
```
All three should resolve without errors.

---

## Architecture Notes

- **Fixed timestep:** The game loop accumulates elapsed time and fires update steps at exactly 1000/60 ms (≈16.67 ms) each. The accumulated delta is capped at 200 ms so returning from a backgrounded tab never triggers a burst of catch-up updates.
- **Scene machine:** `switchScene('Title' | 'Playing' | 'GameOver')` is the only way to change scenes. Each scene owns its own `update` and `draw` functions.
- **HUD contract:** `hud.score`, `hud.lives`, and `hud.hiScore` are plain mutable properties. Later modules import `hud` and write to these directly.
- **No bundler, no server:** Every import uses a relative path. The game works from `file://` in any browser that supports ES modules (Chrome 61+, Firefox 60+, Edge 79+).
