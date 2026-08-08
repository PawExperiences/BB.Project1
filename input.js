// input.js — keyboard input tracking for Space Invaders
// Owned by card: "Keyboard input and the player ship"

// Internal set of currently held keys (by KeyboardEvent.key string)
const heldKeys = new Set();

/**
 * initInput()
 * Attaches keydown and keyup listeners to window.
 * Key-repeat events (event.repeat === true) are ignored so that
 * heldKeys reflects only physical press/release state.
 */
export function initInput() {
  window.addEventListener('keydown', (event) => {
    // Suppress OS key-repeat events
    if (event.repeat) return;
    heldKeys.add(event.key);
  });

  window.addEventListener('keyup', (event) => {
    heldKeys.delete(event.key);
  });
}

/**
 * isKeyHeld(key)
 * @param {string} key — a KeyboardEvent.key string, e.g. 'ArrowLeft', 'a', ' '
 * @returns {boolean} true if the key is currently physically held down
 */
export function isKeyHeld(key) {
  return heldKeys.has(key);
}
