import { textWidth, colourFor } from './measure.js';

export function describeBadge(status: string): { width: number; colour: string } {
  return {
    width: textWidth(status),
    colour: colourFor(status),
  };
}
