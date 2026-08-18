// Keyboard input for the Space Invaders clone.
// Added by "Keyboard input and the player ship".
//
// Held-key tracking: initInput() attaches keydown/keyup listeners and
// maintains the set of keys that are currently held down. Every other
// module reads the keyboard exclusively through isKeyHeld(key) — the held
// state is derived only from keydown/keyup transitions, never from key
// auto-repeat.
//
// Key names are KeyboardEvent.key values ("ArrowLeft", " ", ...). For
// single-character keys the value is normalized to lowercase, so "a" reads
// the same whether or not Shift/CapsLock is engaged.

const heldKeys = new Set();

function normalizeKey(key) {
  return key.length === 1 ? key.toLowerCase() : key;
}

export function initInput() {
  window.addEventListener('keydown', (event) => {
    // Auto-repeat guard: while a key is held, the OS fires extra keydown
    // events with event.repeat === true. Ignoring them keeps the held set
    // driven purely by physical press/release transitions — holding a key
    // never re-adds it or re-triggers anything.
    if (event.repeat) return;
    heldKeys.add(normalizeKey(event.key));
  });

  window.addEventListener('keyup', (event) => {
    heldKeys.delete(normalizeKey(event.key));
  });

  // If the window loses focus mid-press the keyup is never delivered;
  // clearing the set keeps keys from sticking in the held state.
  window.addEventListener('blur', () => {
    heldKeys.clear();
  });
}

// Returns true from the moment the key is pressed (keydown) until it is
// released (keyup); false at all other times.
export function isKeyHeld(key) {
  return heldKeys.has(normalizeKey(key));
}
