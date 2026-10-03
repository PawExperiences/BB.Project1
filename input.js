// Keyboard input for the player ship. Tracks which keys are *currently
// held* (not key-repeat events) so callers can poll isKeyHeld(key) once per
// update(dt) step and get a frame-rate-independent answer.

// event.code (e.g. "KeyA", "ArrowLeft", "Space") is used instead of
// event.key so that matching is unaffected by Shift/Caps Lock -- "A" and
// "a" both report as the physical code "KeyA".
const HANDLED_CODES = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space']);

const heldCodes = new Set();

function normalizeToCode(key) {
  if (key === ' ' || key === 'Space' || key === 'space') {
    return 'Space';
  }
  if (key.length === 1) {
    return `Key${key.toUpperCase()}`;
  }
  return key;
}

function onKeyDown(event) {
  if (HANDLED_CODES.has(event.code)) {
    event.preventDefault();
  }
  // Add unconditionally, including on repeat events: the Set is already
  // true after the first keydown, so repeats are a no-op and nothing here
  // reacts to event.repeat.
  heldCodes.add(event.code);
}

function onKeyUp(event) {
  if (HANDLED_CODES.has(event.code)) {
    event.preventDefault();
  }
  heldCodes.delete(event.code);
}

export function initInput() {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}

export function isKeyHeld(key) {
  return heldCodes.has(normalizeToCode(key));
}
