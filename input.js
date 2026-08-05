// input.js — Keyboard input scaffold.
// Full implementation is delivered by the sibling card
// 'Keyboard input and the player ship'.

// Set of keys currently held down.
const keysDown = new Set();

// Set of keys that were pressed since the last clearJustPressed() call.
const keysJustPressed = new Set();

export function initInput() {
  window.addEventListener('keydown', (e) => {
    if (!keysDown.has(e.key)) {
      keysJustPressed.add(e.key);
    }
    keysDown.add(e.key);
  });

  window.addEventListener('keyup', (e) => {
    keysDown.delete(e.key);
  });
}

/** Returns true if the key is currently held. */
export function isKeyDown(key) {
  return keysDown.has(key);
}

/** Returns true if the key was pressed this tick (not held). */
export function isKeyJustPressed(key) {
  return keysJustPressed.has(key);
}

/** Called by the game loop after each update tick to reset edge-trigger flags. */
export function clearJustPressed() {
  keysJustPressed.clear();
}
