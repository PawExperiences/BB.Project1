// input.js — Keyboard input tracker using held-key state (not key-repeat).
// Exports: initInput(), isKeyHeld(key)

const heldKeys = new Set();

/**
 * Attaches keydown/keyup listeners to window.
 * Must be called once before isKeyHeld() is used.
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
 * Returns true if the given KeyboardEvent.key value is currently held down.
 * @param {string} key — e.g. 'ArrowLeft', ' ', 'a'
 * @returns {boolean}
 */
export function isKeyHeld(key) {
  return heldKeys.has(key);
}
