// input.js — Keyboard input manager for Space Invaders
// Tracks which keys are currently held (no key-repeat interference).

const _heldKeys = new Set();

/**
 * Attach keydown/keyup listeners to window.
 * Call once at startup before the game loop begins.
 */
export function initInput() {
  window.addEventListener('keydown', (e) => {
    _heldKeys.add(e.code);
  });

  window.addEventListener('keyup', (e) => {
    _heldKeys.delete(e.code);
  });
}

/**
 * Returns true if the given key code (KeyboardEvent.code) is currently held.
 * @param {string} code  e.g. 'ArrowLeft', 'Space', 'KeyA'
 * @returns {boolean}
 */
export function isKeyHeld(code) {
  return _heldKeys.has(code);
}
