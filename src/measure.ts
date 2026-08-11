const CHAR_WIDTH_PX = 6.5;
const HALF_PADDING_PX = 10;

const COLOURS: ReadonlyMap<string, string> = new Map([
  ['green', '#97ca00'],
  ['yellow', '#dfb317'],
  ['red', '#e05d44'],
  ['grey', '#9f9f9f'],
]);

const DEFAULT_COLOUR = '#4c1';

export function textWidth(s: string): number {
  return CHAR_WIDTH_PX * s.length + HALF_PADDING_PX * 2;
}

export function colourFor(name: string): string {
  return COLOURS.get(name) ?? DEFAULT_COLOUR;
}
