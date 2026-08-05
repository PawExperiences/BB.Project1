// input.js — Keyboard input module.
// Implements held-key tracking and single-frame edge triggers.
// Safe to call initInput() multiple times (idempotent via guard flag).

// Set of keys currently held down.
const keysDown = new Set();

// Set of keys that were pressed since the last clearJustPressed() call.
const keysJustPressed = new Set();

// Guard so that calling initInput() more than once does not attach
// duplicate event listeners.
let inputInitialised = false;

/**
 * Attach keydown / keyup listeners to window.
 * Safe to call more than once — subsequent calls are no-ops.
 */
export function initInput() {
  if (inputInitialised) return;
  inputInitialised = true;

  window.addEventListener('keydown', (e) => {
    // Record just-pressed only on the first physical down event,
    // not on OS key-repeat events (which also fire keydown).
    if (!keysDown.has(e.key)) {
      keysJustPressed.add(e.key);
    }
    keysDown.add(e.key);
  });

  window.addEventListener('keyup', (e) => {
    keysDown.delete(e.key);
  });
}

/**
 * Returns true if the given key is currently held down.
 * Uses the event.key string (e.g. 'ArrowLeft', ' ', 'a').
 * @param {string} key
 * @returns {boolean}
 */
export function isKeyHeld(key) {
  return keysDown.has(key);
}

/**
 * Alias for isKeyHeld — kept for backwards-compatibility with
 * any consumers that already import isKeyDown.
 * @param {string} key
 * @returns {boolean}
 */
export function isKeyDown(key) {
  return keysDown.has(key);
}

/**
 * Returns true if the key was first pressed during the current tick
 * (i.e. it was not held on the previous tick).
 * @param {string} key
 * @returns {boolean}
 */
export function isKeyJustPressed(key) {
  return keysJustPressed.has(key);
}

/**
 * Called by the game loop after each update tick to clear edge-trigger flags.
 */
export function clearJustPressed() {
  keysJustPressed.clear();
}
