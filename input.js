// input.js — keyboard input module for Space Invaders
// Uses KeyboardEvent.code (layout-independent)

const _heldKeys = new Set();

/**
 * Attaches keydown/keyup listeners to window.
 * Key-repeat events (keydown with repeat=true) are ignored so a held
 * key is registered exactly once until keyup fires.
 */
export function initInput() {
  window.addEventListener('keydown', (e) => {
    // e.repeat is true for browser-generated auto-repeat events
    if (!e.repeat) {
      _heldKeys.add(e.code);
    }
  });

  window.addEventListener('keyup', (e) => {
    _heldKeys.delete(e.code);
  });
}

/**
 * Returns true if the given KeyboardEvent.code is currently held down.
 * @param {string} code — e.g. 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space'
 * @returns {boolean}
 */
export function isKeyHeld(code) {
  return _heldKeys.has(code);
}
