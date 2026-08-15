// Keyboard input tracking: maintains the set of currently-held keys.
// Driven purely by keydown/keyup transitions, so a held key reads as
// continuously true even though the browser re-fires keydown while repeating.

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
