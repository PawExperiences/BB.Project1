// input.js — Keyboard held-state tracker
// ES module; no dependencies, no network requests.

const heldKeys = new Set();

/**
 * Attach keydown / keyup listeners to window.
 * Safe to call multiple times — listeners are idempotent because the Set
 * handles duplicate keydown events (OS key-repeat) without toggling.
 */
export function initInput() {
  window.addEventListener('keydown', (e) => {
    // AC2: key-repeat events have e.repeat === true; we ignore them so the
    // Set entry is only ever added on the *first* physical keydown.
    if (e.repeat) return;
    heldKeys.add(e.code);
  });

  window.addEventListener('keyup', (e) => {
    heldKeys.delete(e.code);
  });
}

/**
 * Returns true while the key identified by its KeyboardEvent.code string
 * (e.g. 'ArrowLeft', 'KeyA', 'Space') is physically held down.
 *
 * @param {string} code  – KeyboardEvent.code value
 * @returns {boolean}
 */
export function isKeyHeld(code) {
  return heldKeys.has(code);
}
