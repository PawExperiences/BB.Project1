# Space Invaders — BB.Project1

A browser-native Space Invaders game built with hand-written HTML, CSS, and ES modules.  
No framework, no bundler, no npm. Open `index.html` directly from the filesystem.

---

## File Layout

### Files owned by this card (Game loop and canvas framework)

| File | Description |
|------|-------------|
| `index.html` | Page shell, `<canvas>` element, loads `game.js` as a module |
| `game.js` | Fixed-timestep game loop, scene state machine, HUD, `hudState` export |
| `gameConfig.js` | Shared named constants (canvas size, speeds, lives) |
| `README.md` | Project documentation (this file) |

### Files owned by later cards

| File | Owning card |
|------|-------------|
| `input.js` | Keyboard input and the player ship |
| `player.js` | Player ship implementation |
| `invaders.js` | Invader grid and movement |
| `collision.js` | Collision detection |
| `level1.js` | Level 1 |
| `level2.js` | Level 2 |
| `level3.js` | Level 3 |
| `boss.js` | Boss encounter |

---

## Running the Game

1. Clone or download the repository so all files are in the same folder.
2. Open `index.html` in a modern browser using a `file://` URL  
   (e.g. drag the file into the browser, or `File → Open File…`).
3. No web server, no `npm install`, no build step is required.

---

## Manual Verification

Follow these steps to confirm every acceptance criterion after checkout.

### Prerequisites
- A modern desktop browser (Chrome 90+, Firefox 88+, or Edge 90+).
- All four files (`index.html`, `game.js`, `gameConfig.js`, `README.md`) in the same directory.

---

### 1. Open from `file://`

1. In your file manager, double-click `index.html`, **or** drag it into a browser tab,  
   **or** use the browser menu `File → Open File…`.
2. Confirm the address bar shows a `file://…/index.html` URL.
3. **Expected:** A black page with a centred black canvas (768 × 896).

---

### 2. Title scene

1. The canvas should immediately display the Title scene.
2. **Expected:**
   - Green text `SPACE INVADERS` centred horizontally and vertically.
   - White text `Press ENTER to start` below it, also centred.
   - Grey text `HI-SCORE: 0` below that.

---

### 3. Title → Playing transition (Enter key, no reload)

1. Press the **Enter** key once.
2. **Expected:**
   - The canvas clears (black screen).
   - The HUD appears in the top-left (`SCORE: 0`) and top-right (`LIVES: 3`).
   - The browser URL does **not** change; there is no page reload.

---

### 4. Fixed-timestep loop running at 60 Hz

1. With the Playing scene active, open the browser DevTools console.
2. Paste and run:
   ```js
   let frames = 0;
   const id = requestAnimationFrame(function count() {
     frames++;
     requestAnimationFrame(count);
   });
   setTimeout(() => { cancelAnimationFrame(id); console.log('rAF/s:', frames); }, 1000);
   ```
3. **Expected:** The logged value is approximately 60 (±5).

---

### 5. Delta cap — no burst after tab backgrounding

1. Ensure the Playing scene is active.
2. Switch to a different browser tab (or minimise) for at least 5 seconds.
3. Switch back to the game tab.
4. **Expected:** The game resumes smoothly with no visible "catch-up" stutter;  
   the HUD score does not jump unexpectedly (stays at 0 in the placeholder build).

---

### 6. HUD during Playing scene

1. With the Playing scene active, open DevTools console.
2. Run:
   ```js
   import('./game.js').then(m => { m.hudState.score = 1500; m.hudState.lives = 2; });
   ```
   *(Or, if the module is already loaded: `hudState.score = 1500; hudState.lives = 2;`  
   after importing it in the console.)*
3. **Expected:** The canvas HUD immediately reflects `SCORE: 1500` and `LIVES: 2`.

---

### 7. Playing → Game Over transition

1. With the Playing scene active, press **Enter**  
   *(placeholder shortcut — simulates a game-over event for verification).*
2. **Expected:**
   - Red text `GAME OVER` centred on the canvas.
   - White text `SCORE: <value>` (whatever `hudState.score` was).
   - Grey text `HI-SCORE: <value>`.
   - White text `Press ENTER to restart`.
   - No page reload.

---

### 8. Score displayed on Game Over screen

1. Before triggering Game Over (still on Playing scene), run in DevTools console:
   ```js
   import('./game.js').then(m => { m.hudState.score = 4200; });
   ```
2. Press **Enter** to trigger Game Over.
3. **Expected:** The Game Over scene shows `SCORE: 4200`.

---

### 9. Game Over → Title transition; hi-score retention

1. On the Game Over scene, press **Enter**.
2. **Expected:**
   - The Title scene re-appears (no page reload).
   - `HI-SCORE:` on the Title scene shows the highest score seen this session  
     (e.g. `4200` from step 8 above).
   - `SCORE` and `LIVES` reset for the next round.

---

### 10. Hi-score persists across multiple cycles

1. Complete the cycle: Title → Playing → Game Over → Title at least twice.
2. Ensure the second run's score is lower than the first.
3. **Expected:** The hi-score on the Title scene retains the highest value seen  
   across all cycles within the same page session.

---

### 11. Import stub comments in game.js

1. Open `game.js` in a text editor.
2. Search for `// TODO: import added by card`.
3. **Expected:** Eight such comments appear, one for each future file:  
   `input.js`, `player.js`, `invaders.js`, `collision.js`,  
   `level1.js`, `level2.js`, `level3.js`, `boss.js`.
4. Confirm none of those eight files exist in the repository.

---

### 12. No external dependencies

1. Inspect `index.html` — confirm there are no `<script src="https://…">` tags,  
   no CDN links, and no `fetch()` calls.
2. Confirm there is no `package.json`, `node_modules/`, or bundler config file.
3. Disconnect from the internet and reload `index.html`.
4. **Expected:** The game loads and runs identically.

---

*All checks above should pass on the `develop` branch before this card is moved to Done.*
