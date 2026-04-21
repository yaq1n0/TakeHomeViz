import { findCrossovers } from './crossovers';

describe('findCrossovers', () => {
  it('returns [] for two non-crossing monotonic lines', () => {
    const xs = [0, 1, 2, 3];
    const ys = [
      [0, 1, 2, 3],
      [1, 2, 3, 4],
    ];
    expect(findCrossovers(xs, ys)).toEqual([]);
  });

  it('finds one crossing with a < b and interpolated values', () => {
    const xs = [0, 10];
    const ys = [
      [0, 10],
      [5, 5],
    ];
    const result = findCrossovers(xs, ys);
    expect(result).toHaveLength(1);
    expect(result[0]!.a).toBe(0);
    expect(result[0]!.b).toBe(1);
    expect(result[0]!.gross).toBeCloseTo(5, 10);
    expect(result[0]!.spendable).toBeCloseTo(5, 10);
  });

  it('finds multiple pairwise crossings for three scenarios', () => {
    const xs = [0, 10];
    const ys = [
      [0, 10], // 0
      [10, 0], // 1: crosses 0 and 2
      [5, 6], // 2: crosses 1 (5<10, 6>0) but not 0 (0<5, 10>6 — sign change too)
    ];
    const result = findCrossovers(xs, ys);
    expect(result).toHaveLength(3);
    const pairs = result.map((r) => `${r.a}-${r.b}`).sort();
    expect(pairs).toEqual(['0-1', '0-2', '1-2']);
  });

  it('ignores grazing contact where d0 or d1 is exactly 0', () => {
    const xs = [0, 1, 2];
    const ys = [
      [0, 1, 2],
      [1, 1, 3], // touches at i=1 but no strict sign change across [0,1] or [1,2]
    ];
    expect(findCrossovers(xs, ys)).toEqual([]);
  });

  it('skips intervals containing null endpoints', () => {
    const xs = [0, 1, 2];
    const ys = [
      [0, null, 2],
      [2, 1, 0],
    ];
    expect(findCrossovers(xs, ys)).toEqual([]);
  });

  it('returns [] for empty xs or length 1', () => {
    expect(findCrossovers([], [[0], [1]])).toEqual([]);
    expect(findCrossovers([5], [[0], [1]])).toEqual([]);
  });

  it('interpolation accuracy within 1e-9', () => {
    // a(x) = x, b(x) = 10 - x, cross at x=5, y=5.
    const xs = [0, 10];
    const ys = [
      [0, 10],
      [10, 0],
    ];
    const [c] = findCrossovers(xs, ys);
    expect(Math.abs(c!.gross - 5)).toBeLessThan(1e-9);
    expect(Math.abs(c!.spendable - 5)).toBeLessThan(1e-9);
  });
});
