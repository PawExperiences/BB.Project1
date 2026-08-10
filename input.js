// Tracks which keys are physically held down right now, via keydown/keyup
// listeners. Backed by a Set, so OS key-repeat keydown events (which fire
// repeatedly for an already-held key) do not change the tracked state.

const heldKeys = new Set();

export function initInput() {
  window.addEventListener('keydown', (event) => {
    heldKeys.add(event.key);
  });

  window.addEventListener('keyup', (event) => {
    heldKeys.delete(event.key);
  });
}

export function isKeyHeld(key) {
  return heldKeys.has(key);
}
