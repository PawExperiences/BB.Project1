/**
 * input.js — Keyboard state tracker.
 *
 * initInput()     : call once at startup to attach keydown/keyup listeners.
 * isKeyHeld(key)  : returns true while the given KeyboardEvent.key is held.
 *
 * Relies solely on keydown/keyup events (NOT key-repeat) so the held state
 * is always authoritative regardless of OS repeat-delay settings.
 */

// Map of KeyboardEvent.key → boolean (true = currently held)
const heldKeys = new Map();

/**
 * Attach keydown and keyup listeners to window.
 * Safe to call once during game startup in a file:// context.
 */
export function initInput() {
  window.addEventListener('keydown', (e) => {
    heldKeys.set(e.key, true);
  });

  window.addEventListener('keyup', (e) => {
    heldKeys.set(e.key, false);
  });
}

/**
 * Returns true if the given key is currently held down, false otherwise.
 * @param {string} key - A KeyboardEvent.key string, e.g. 'ArrowLeft', ' ', 'a'.
 */
export function isKeyHeld(key) {
  return heldKeys.get(key) === true;
}
