// score.js — Score state module.
//
// Maintains the player's current score and exports read/write helpers.
// Other modules (collision.js, HUD) import getScore() / addScore().

let _score = 0;

/**
 * getScore — return the current score.
 * @returns {number}
 */
export function getScore() {
  return _score;
}

/**
 * addScore — add n points to the current score.
 * @param {number} n
 */
export function addScore(n) {
  _score += n;
}

/**
 * resetScore — reset score to zero (called on game reset).
 */
export function resetScore() {
  _score = 0;
}
