// input.js — Low-level keyboard input tracking
// Card: "Keyboard input and the player ship"

const heldKeys = new Set();
let initialised = false;

/**
 * Attaches keydown/keyup listeners to window.
 * Safe to call multiple times — only attaches once.
 */
export function initInput() {
  if (initialised) return;
  initialised = true;

  window.addEventListener('keydown', (e) => {
    // Normalise to lowercase so 'a'/'A' both match 'a'
    heldKeys.add(normalise(e.key));
  });

  window.addEventListener('keyup', (e) => {
    heldKeys.delete(normalise(e.key));
  });
}

/**
 * Returns true while the given key string is physically held down.
 * Immune to browser key-repeat because we use a Set: adding the
 * same key on repeated keydown events is a no-op.
 *
 * @param {string} key  e.g. 'ArrowLeft', 'ArrowRight', 'a', 'd', ' '
 * @returns {boolean}
 */
export function isKeyHeld(key) {
  return heldKeys.has(normalise(key));
}

/**
 * Normalise a key string:
 * - Single alphabetic characters are lowercased ('A' -> 'a').
 * - All other keys (arrows, Space, etc.) are left as-is.
 *
 * @param {string} key
 * @returns {string}
 */
function normalise(key) {
  if (key.length === 1) {
    return key.toLowerCase();
  }
  return key;
}
