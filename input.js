// input.js — Keyboard input abstraction for Space Invaders
// Tracks physically held keys using KeyboardEvent.code.
// Key-repeat events are ignored because we only toggle on the first
// press (keydown fires repeatedly, but adding an already-present code
// to a Set is a no-op, so there is no false toggling).

const heldKeys = new Set();

/**
 * Attach keydown / keyup listeners to window.
 * Must be called once before any isKeyHeld() queries.
 */
export function initInput() {
  window.addEventListener('keydown', function (e) {
    // e.repeat is true for auto-repeated events; we still add the code
    // (Set.add is idempotent) but the held state is already correct, so
    // there is no observable difference — repeat events cannot cause
    // the key to appear "released and re-pressed".
    heldKeys.add(e.code);
  });

  window.addEventListener('keyup', function (e) {
    heldKeys.delete(e.code);
  });
}

/**
 * Returns true if the key identified by `code` (KeyboardEvent.code)
 * is currently physically held down.
 * Returns false for any code that has never been pressed.
 *
 * @param {string} code  e.g. 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space'
 * @returns {boolean}
 */
export function isKeyHeld(code) {
  return heldKeys.has(code);
}
