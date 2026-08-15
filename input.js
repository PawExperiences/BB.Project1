// Tracks which keys are physically held right now.
// State is built from keydown/keyup sets (not from repeat auto-fire), so a
// held key reads as continuously "held" instead of toggling on each repeat.

const heldKeys = new Set();
let initialized = false;

export function initInput() {
  if (initialized) return;
  initialized = true;

  window.addEventListener('keydown', (event) => {
    heldKeys.add(event.key);
    // The space bar's KeyboardEvent.key is the literal ' ' character; also
    // track it under the 'Space' alias so callers can query either form.
    if (event.key === ' ') heldKeys.add('Space');
  });

  window.addEventListener('keyup', (event) => {
    heldKeys.delete(event.key);
    if (event.key === ' ') heldKeys.delete('Space');
  });
}

export function isKeyHeld(key) {
  return heldKeys.has(key);
}
