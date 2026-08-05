// input.js — Keyboard input module
//
// Exports:
//   initInput()       — attaches keydown/keyup listeners to window (idempotent).
//   isKeyHeld(code)   — returns true if the given KeyboardEvent.code is held.
//
// Uses a Set of currently-held key codes so that held state is NOT driven
// by key-repeat events — only real keydown/keyup transitions matter.

/**
 * inputState — legacy object kept for backward compatibility with any
 * existing imports from the stub.  Updated alongside the Set inside
 * initInput() so both interfaces stay in sync.
 */
export const inputState = {
  left:  false,
  right: false,
  fire:  false,
};

// Internal Set that tracks every currently-held KeyboardEvent.code.
const _heldKeys = new Set();

// Guard flag so calling initInput() more than once is a no-op.
let _initialised = false;

/**
 * initInput — attaches keydown/keyup listeners to window.
 * Safe to call multiple times; only one set of listeners is ever attached.
 */
export function initInput() {
  if (_initialised) return;
  _initialised = true;

  window.addEventListener('keydown', (e) => {
    // Ignore key-repeat synthetic events (held key fires repeated keydown).
    if (e.repeat) return;
    _heldKeys.add(e.code);

    // Keep legacy inputState in sync.
    if (e.code === 'ArrowLeft'  || e.code === 'KeyA') inputState.left  = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') inputState.right = true;
    if (e.code === 'Space')                           inputState.fire  = true;
  });

  window.addEventListener('keyup', (e) => {
    _heldKeys.delete(e.code);

    // Keep legacy inputState in sync.
    if (e.code === 'ArrowLeft'  || e.code === 'KeyA') inputState.left  = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') inputState.right = false;
    if (e.code === 'Space')                           inputState.fire  = false;
  });
}

/**
 * isKeyHeld — returns true if the given KeyboardEvent.code string is
 * currently held down, false otherwise.
 *
 * @param {string} code - A KeyboardEvent.code value, e.g. 'ArrowLeft'.
 * @returns {boolean}
 */
export function isKeyHeld(code) {
  return _heldKeys.has(code);
}
