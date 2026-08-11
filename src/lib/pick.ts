/**
 * Deterministically selects one element from `items` based on `seed`.
 *
 * The same `items` array and the same `seed` always yield the same result,
 * across calls and across process runs — no `Math.random()`, no clock reads.
 * `seed` accepts a string (e.g. an ISO date) or a number (e.g. a timestamp)
 * so callers can derive selection from a build/commit date.
 */
export function pick<T>(items: readonly T[], seed: string | number): T {
  if (items.length === 0) {
    throw new Error("pick: cannot select an item from an empty array");
  }

  const index = hashSeed(seed) % items.length;
  return items[index];
}

// FNV-1a: a small, dependency-free string hash with good distribution,
// used here purely to turn an arbitrary seed into a stable array index.
function hashSeed(seed: string | number): number {
  const input = typeof seed === "number" ? seed.toString() : seed;

  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}
