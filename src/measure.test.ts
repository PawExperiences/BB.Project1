import { describe, expect, it } from 'vitest';
import { colourFor, textWidth } from './measure.js';

describe('textWidth', () => {
  it('returns padding only for an empty string', () => {
    expect(textWidth('')).toBe(6.5 * 0 + 20);
  });

  it('returns 6.5px per character plus 20px padding for a non-empty string', () => {
    expect(textWidth('build')).toBe(6.5 * 'build'.length + 20);
  });
});

describe('colourFor', () => {
  it('resolves green', () => {
    expect(colourFor('green')).toBe('#97ca00');
  });

  it('resolves yellow', () => {
    expect(colourFor('yellow')).toBe('#dfb317');
  });

  it('resolves red', () => {
    expect(colourFor('red')).toBe('#e05d44');
  });

  it('resolves grey', () => {
    expect(colourFor('grey')).toBe('#9f9f9f');
  });

  it('falls back to the default colour for an unrecognised name', () => {
    expect(colourFor('purple')).toBe('#4c1');
  });

  it('is case-sensitive, falling back to the default colour', () => {
    expect(colourFor('Green')).toBe('#4c1');
  });
});
