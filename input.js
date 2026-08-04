/**
 * input.js — Keyboard input handler.
 *
 * Responsibilities (this card):
 *  - Track which keys are currently held (keysDown).
 *  - Track which keys were pressed this frame (justPressed) so that
 *    one keydown fires exactly one action regardless of key-repeat.
 *
 * Full player-movement wiring is handled in the next card.
 */

// Keys currently held down
const keysDown = new Set();

// Keys pressed since the last clearJustPressed() call
const justPressed = new Set();

function onKeyDown(event) {
  if (!keysDown.has(event.key)) {
    // First time this frame the key transitions to pressed
    justPressed.add(event.key);
  }
  keysDown.add(event.key);
}

function onKeyUp(event) {
  keysDown.delete(event.key);
}

/**
 * initInput — attach DOM listeners.
 * Called once during game bootstrap.
 */
export function initInput() {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup',   onKeyUp);
}

/**
 * isKeyDown — returns true while the key is held.
 * @param {string} key — e.g. 'ArrowLeft', 'Space'
 */
export function isKeyDown(key) {
  return keysDown.has(key);
}

/**
 * isKeyJustPressed — returns true if the key was pressed this update step.
 * @param {string} key
 */
export function isKeyJustPressed(key) {
  return justPressed.has(key);
}

/**
 * clearJustPressed — must be called at the END of each update step.
 * game.js calls this after processing input.
 */
export function clearJustPressed() {
  justPressed.clear();
}
