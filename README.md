# Space Invaders — BB.Project1

## Planned File Layout

| File | Status | Card |
|------|--------|------|
| `index.html` | ✅ Implemented | Game Loop & Canvas Framework |
| `game.js` | ✅ Implemented | Game Loop & Canvas Framework |
| `gameConfig.js` | ✅ Implemented | Game Loop & Canvas Framework |
| `input.js` | ⏳ Future | Input card |
| `player.js` | ⏳ Future | Player card |
| `invaders.js` | ⏳ Future | Invaders card |
| `collision.js` | ⏳ Future | Collision card |
| `level1.js` | ⏳ Future | Level 1 card |
| `level2.js` | ⏳ Future | Level 2 card |
| `level3.js` | ⏳ Future | Level 3 card |
| `boss.js` | ⏳ Future | Boss card |

---

## Architecture Overview

### `gameConfig.js`
Pure ES module — named constants only, no logic:
- `CANVAS_WIDTH = 768`
- `CANVAS_HEIGHT = 896`
- `PLAYER_SPEED = 200` (px/s)
- `BULLET_SPEED = 500` (px/s)
- `STARTING_LIVES = 3`

### `index.html`
- Single `768 × 896` canvas centred on a black background.
- Loads `game.js` as an ES module (`type="module"`).
- Works from a `file://` URL — no server needed.

### `game.js`
- **Fixed-timestep loop**: 60 update steps/second; accumulated delta capped at 0.25 s.
- **Scene state machine**: `title` → `playing` → `gameover` → `title`.
- **HUD**: drawn on-canvas; exports `hudState { score, lives, hiScore }` for later cards.
- **Stub comments**: marks every future import site with the owning card.

---

## Manual Verification Checklist

Open `index.html` by double-clicking it (or dragging it into a browser) so the URL begins with `file://`.

### 1 — Initial load
- [ ] No console errors appear in DevTools (`F12 → Console`).
- [ ] A **768 × 896** canvas is visible, centred on a black page.

### 2 — Title scene
- [ ] **"SPACE INVADERS"** appears in large green text, centred on the canvas.
- [ ] **"Press ENTER to start"** appears below it in white.

### 3 — ENTER transition (Title → Playing)
- [ ] Pressing **ENTER** switches immediately to the Playing scene **without** a page reload.
- [ ] The title text disappears.

### 4 — Playing scene / HUD
- [ ] The HUD is visible at the top of the canvas:
  - **SCORE: 0** on the left.
  - **HI: 0** centred.
  - **LIVES: 3** on the right (in green).
- [ ] A placeholder message `"(Press G to simulate Game Over)"` is shown mid-canvas.

### 5 — Game Over transition (Playing → Game Over)
- [ ] Pressing **G** switches to the Game Over scene **without** a page reload.
- [ ] **"GAME OVER"** appears in large red text.
- [ ] The final score is shown below it.
- [ ] **"Press ENTER to restart"** appears below the score.

### 6 — ENTER transition (Game Over → Title)
- [ ] Pressing **ENTER** returns to the **Title scene** (no page reload).
- [ ] Score has been reset to 0; HI score (if any) is preserved for the session.

### 7 — Background-tab behaviour
- [ ] Switch away from the browser tab for 5+ seconds, then switch back.
- [ ] The game does **not** stutter or fire a burst of updates on return (delta cap works).

---

## Running

No build step, no server, no npm required.

```
# Simply open the file:
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

Or drag `index.html` into any modern browser (Chrome, Firefox, Edge, Safari).
