/**
 * input.js — Keyboard input module for Space Invaders.
 * ES module; tracks which keys are currently held via keydown/keyup events.
 *
 * Exports:
 *   initInput()       — attaches exactly one keydown and one keyup listener to window.
 *   isKeyHeld(code)   — returns true if the given event.code is currently held.
 */

// Internal set of currently-held key codes.
const heldKeys = new Set();

/**
 * Attaches keyboard listeners to window.
 * Call once at startup; subsequent calls are idempotent because the named
 * handler references are the same function objects.
 */
export function initInput() {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup',   onKeyUp);
}

/**
 * Returns true if the given event.code is currently physically held.
 * @param {string} code  e.g. 'ArrowLeft', 'Space', 'KeyA'
 * @returns {boolean}
 */
export function isKeyHeld(code) {
  return heldKeys.has(code);
}

// ---------------------------------------------------------------------------
// Private handlers
// ---------------------------------------------------------------------------

/**
 * keydown handler.
 * Ignores browser key-repeat events (event.repeat === true).
 * @param {KeyboardEvent} event
 */
function onKeyDown(event) {
  if (event.repeat) return;   // ignore browser-generated auto-repeat
  heldKeys.add(event.code);
}

/**
 * keyup handler.
 * @param {KeyboardEvent} event
 */
function onKeyUp(event) {
  heldKeys.delete(event.code);
}
