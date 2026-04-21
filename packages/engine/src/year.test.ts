import { describe, expect, it } from 'vitest';
import { year } from './year.js';

describe('year()', () => {
  it('accepts valid integer years', () => {
    expect(year(2026)).toBe(2026);
  });

  it('rejects non-integers', () => {
    expect(() => year(2026.5)).toThrow(/integer/);
  });

  it('rejects out-of-range', () => {
    expect(() => year(1999)).toThrow(/range/i);
    expect(() => year(2101)).toThrow(/range/i);
  });
});
