# Space Invaders

A hand-written, dependency-free Space Invaders clone built with plain HTML5 Canvas and ES modules.

## How to Play

1. Open `index.html` directly in a modern browser (Chrome, Firefox, Edge).
   - No server required — the game runs from `file://` without any build step.
2. Press **Enter** on the menu screen to start.
3. Use **Arrow Left / Arrow Right** (or **A / D**) to move your ship.
4. Press **Space** to fire.
5. Defeat all invaders to advance through the levels.

## Game Screens & Flow

```
Menu → Level 1 → Level 2 → Level 3 → Boss Fight → Win Screen
                                          ↓
                                    (player dies)
                                          ↓
                                       Level 1
```

- **Levels 1–3:** Clear all invaders to advance. Invaders shoot back; losing all lives restarts at Level 1.
- **Boss Fight:** Reached automatically after clearing Level 3.
- **Win Screen:** Displayed when the boss is defeated.

## Controls Summary

| Key | Action |
|-----|--------|
| Arrow Left / A | Move left |
| Arrow Right / D | Move right |
| Space | Fire |
| Enter | Start / Restart |

---

## Manual Verification Path

### Standard Play-Through
1. Open `index.html` in a browser.
2. Press **Enter** — Level 1 loads; the score shows `0` and lives show `3`.
3. Destroy all 55 invaders — Level 2 loads automatically.
4. Destroy all invaders in Level 2 — Level 3 loads.
5. Destroy all invaders in Level 3 — **Boss Fight** loads.

### Testing the Boss Fight
1. **Boss appears:** A large (~120×80 px) red enemy appears at the top of the canvas, drawn entirely with canvas primitives (no image assets). It should be clearly larger and more visually distinct than the regular invaders.
2. **Health bar:** A health bar reading `HP 10 / 10` is visible just below the boss. It updates immediately with each successful hit.
3. **Phase 1 (HP 10–6):** Boss fires a 3-shot spread pattern roughly every **1.4 seconds**. Fire rate should feel moderate.
4. **Phase transition at HP 5:** When the boss drops to 5 HP, the scene label changes to `⚠ PHASE 2 ⚠` (red text) and a glowing orange border appears around the boss. The fire rate visibly doubles — shots arrive roughly every **0.7 seconds**.
5. **Boss horizontal movement:** The boss moves left and right, bouncing off both canvas edges.
6. **Sudden-death rule:** A single boss projectile hitting the player immediately ends the run — score resets to 0 and Level 1 restarts, regardless of remaining lives.
7. **Win condition:** Reduce the boss to 0 HP — the **Win Screen** appears.

### Testing the Win Screen
1. The Win Screen displays:
   - `YOU WIN!` heading (yellow, glowing).
   - `CONGRATULATIONS!` subtitle (green).
   - `FINAL SCORE: <N>` where `<N>` is the score accumulated during the run.
2. Press **Enter** — the game resets to Level 1 with score 0.

### Testing Loss / Restart
1. During the boss fight, allow a boss projectile to hit the player ship.
2. The run immediately ends (no HP countdown), score resets, and Level 1 reloads.
3. Confirm that Level 1 is fully functional after the restart.

### Regression Check — Levels 1–3
- After the boss additions, confirm Levels 1, 2, and 3 all play correctly from a fresh start.
- Invaders shoot back, shields (Level 3) absorb bullets, and score accumulates correctly.

---

## File Structure

```
index.html       — Entry point (open this)
game.js          — Scene management, game loop, all scene classes
player.js        — Player ship (movement, bullet, drawing)
invaders.js      — Invader grid (movement, drawing)
collision.js     — Bullet–invader collision detection
input.js         — Keyboard input (held-key tracking)
gameConfig.js    — Shared constants (lives, canvas height)
```
