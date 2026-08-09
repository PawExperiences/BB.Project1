// input.js — keyboard input abstraction for Space Invaders
// ES module: exports initInput() and isKeyHeld(key)

const heldKeys = new Set();

/**
 * Attach keydown/keyup listeners to window.
 * Must be called once before any isKeyHeld() query.
 * Key-repeat events (where event.repeat === true) are ignored so that
 * the Set reflects genuine physical held state only.
 */
export function initInput() {
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return; // ignore browser key-repeat
    heldKeys.add(e.key);
  });

  window.addEventListener('keyup', (e) => {
    heldKeys.delete(e.key);
  });
}

/**
 * Returns true if the given KeyboardEvent.key value is currently held down.
 * @param {string} key — e.g. 'ArrowLeft', 'a', ' '
 * @returns {boolean}
 */
export function isKeyHeld(key) {
  return heldKeys.has(key);
}
