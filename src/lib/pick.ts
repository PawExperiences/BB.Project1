/**
 * Deterministically selects one item from a list based on a seed string.
 *
 * The same array and seed always produce the same result, including across
 * separate process invocations, so callers can use it for build-time
 * selection that needs to be reproducible (e.g. keyed by a build date)
 * rather than random.
 */
export function pick<T>(items: readonly T[], seed: string): T {
  if (items.length === 0) {
    throw new Error('pick: cannot select an item from an empty array');
  }

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }

  const index = Math.abs(hash) % items.length;
  return items[index];
}
