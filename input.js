// input.js — Keyboard input handler.
// Tracks which keys are currently held using a Set, avoiding reliance on key-repeat.

/** @type {Set<string>} */
const heldKeys = new Set();

/**
 * Register keydown/keyup listeners on window.
 * Call once at startup before the game loop begins.
 */
export function initInput() {
  window.addEventListener('keydown', (e) => {
    heldKeys.add(e.key);
  });
  window.addEventListener('keyup', (e) => {
    heldKeys.delete(e.key);
  });
}

/**
 * Returns true while the given key is held down.
 * @param {string} key  A KeyboardEvent.key string, e.g. 'ArrowLeft', 'Space'
 * @returns {boolean}
 */
export function isKeyHeld(key) {
  return heldKeys.has(key);
}
