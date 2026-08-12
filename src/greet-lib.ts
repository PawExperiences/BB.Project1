export function greeting(names: string[]): string {
  if (names.length === 0) {
    return "Hello, World!";
  }

  if (names.length === 1) {
    return `Hello, ${names[0]}!`;
  }

  if (names.length === 2) {
    return `Hello, ${names[0]} and ${names[1]}!`;
  }

  const allButLast = names.slice(0, -1);
  const last = names[names.length - 1];
  return `Hello, ${allButLast.join(", ")}, and ${last}!`;
}
