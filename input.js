// input.js
// Tracks which keys are physically held down via keydown/keyup, ignoring OS
// key-repeat, so gameplay code can poll "is this key down right now".

const heldKeys = new Set();

// Single characters (letters, space) are normalized to lowercase so e.g.
// Shift+A and a both register as the same held key.
function normalizeKey(key) {
  return key.length === 1 ? key.toLowerCase() : key;
}

function handleKeyDown(event) {
  if (event.repeat) return;
  heldKeys.add(normalizeKey(event.key));
}

function handleKeyUp(event) {
  heldKeys.delete(normalizeKey(event.key));
}

export function initInput() {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
}

export function isKeyHeld(key) {
  return heldKeys.has(normalizeKey(key));
}
