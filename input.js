// input.js — Keyboard input stub
// Full keyboard handling (arrow keys, fire key) is implemented in the
// 'Keyboard input and the player ship' card.  This file exists now so that
// any module can safely `import { inputState } from './input.js'` without
// throwing, and so the interface contract is established.

/**
 * inputState — live object read by player.js and other modules each update tick.
 * Fields are set to true while the corresponding key is held.
 */
export const inputState = {
  left:  false,
  right: false,
  fire:  false,
};
