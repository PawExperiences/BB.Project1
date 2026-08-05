// input.js — Keyboard state tracker
// Tracks which keys are currently held using a Map.
// Must be initialised once with initInput() before isKeyHeld() is used.

const heldKeys = new Map();

/**
 * initInput()
 * Attaches keydown and keyup event listeners to window.
 * Records held state by KeyboardEvent.code — no reliance on key-repeat.
 */
export function initInput() {
  window.addEventListener('keydown', (e) => {
    heldKeys.set(e.code, true);
  });

  window.addEventListener('keyup', (e) => {
    heldKeys.set(e.code, false);
  });
}

/**
 * isKeyHeld(key)
 * @param {string} key — a KeyboardEvent.code string, e.g. 'ArrowLeft', 'Space'
 * @returns {boolean} true if the key is currently held down, false otherwise
 */
export function isKeyHeld(key) {
  return heldKeys.get(key) === true;
}
