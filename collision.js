// collision.js — Collision detection stub.
// Full implementation is owned by the Collision card.

/**
 * Test whether two axis-aligned bounding boxes overlap.
 * Stub always returns false until the Collision card implements it.
 * @param {{ x: number, y: number, w: number, h: number }} _a
 * @param {{ x: number, y: number, w: number, h: number }} _b
 * @returns {boolean}
 */
export function rectsOverlap(_a, _b) {
  return false;
}

/**
 * Run all collision checks for the current frame.
 * Stub is a no-op.
 */
export function checkCollisions() {
  // TODO: implement in the Collision card
}
