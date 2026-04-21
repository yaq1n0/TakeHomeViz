import { describe, expect, it } from 'vitest';
import { Money, bankersRound } from './money.js';

describe('Money', () => {
  it('constructs with integer minor units', () => {
    const m = new Money(1234_56, 'GBP');
    expect(m.amount).toBe(123456);
    expect(m.currency).toBe('GBP');
  });

  it('rejects non-integer amounts', () => {
    expect(() => new Money(1.5, 'GBP')).toThrow(/integer/);
  });

  it('rejects NaN / Infinity', () => {
    expect(() => new Money(Number.NaN, 'GBP')).toThrow();
    expect(() => new Money(Number.POSITIVE_INFINITY, 'GBP')).toThrow();
  });

  it('rejects unknown currency', () => {
    // @ts-expect-error — testing runtime guard
    expect(() => new Money(100, 'EUR')).toThrow(/currency/);
  });

  it('add / sub enforce matching currency', () => {
    const g = new Money(100, 'GBP');
    const u = new Money(100, 'USD');
    expect(() => g.add(u)).toThrow(/currency mismatch/);
    expect(() => g.sub(u)).toThrow(/currency mismatch/);
  });

  it('add / sub return new Money', () => {
    const a = new Money(100, 'GBP');
    const b = new Money(50, 'GBP');
    expect(a.add(b).amount).toBe(150);
    expect(a.sub(b).amount).toBe(50);
  });

  it("mul uses banker's rounding", () => {
    // 1 * 0.5 = 0.5 → 0 (round-half-to-even)
    expect(new Money(1, 'GBP').mul(0.5).amount).toBe(0);
    // 3 * 0.5 = 1.5 → 2 (round-half-to-even)
    expect(new Money(3, 'GBP').mul(0.5).amount).toBe(2);
    // 5 * 0.5 = 2.5 → 2 (round-half-to-even)
    expect(new Money(5, 'GBP').mul(0.5).amount).toBe(2);
  });

  it('div rejects zero scalar', () => {
    expect(() => new Money(100, 'GBP').div(0)).toThrow();
  });

  it('comparisons work', () => {
    const a = new Money(100, 'GBP');
    const b = new Money(200, 'GBP');
    expect(a.lt(b)).toBe(true);
    expect(b.gt(a)).toBe(true);
    expect(a.eq(new Money(100, 'GBP'))).toBe(true);
    expect(a.eq(new Money(100, 'USD'))).toBe(false);
    expect(a.lte(new Money(100, 'GBP'))).toBe(true);
    expect(a.gte(new Money(100, 'GBP'))).toBe(true);
  });

  it('max / min', () => {
    const a = new Money(100, 'GBP');
    const b = new Money(200, 'GBP');
    expect(Money.max(a, b).amount).toBe(200);
    expect(Money.min(a, b).amount).toBe(100);
  });

  it('toString formats with symbol', () => {
    expect(new Money(1234567, 'GBP').toString()).toBe('£12,345.67');
    expect(new Money(-1234567, 'USD').toString()).toBe('-$12,345.67');
    expect(new Money(7, 'GBP').toString()).toBe('£0.07');
  });

  it('zero / negate / predicates', () => {
    expect(Money.zero('GBP').isZero()).toBe(true);
    expect(new Money(-5, 'GBP').isNegative()).toBe(true);
    expect(new Money(5, 'GBP').isPositive()).toBe(true);
    expect(new Money(5, 'GBP').neg().amount).toBe(-5);
  });

  it('toJSON is structurally clonable', () => {
    expect(new Money(100, 'GBP').toJSON()).toEqual({ amount: 100, currency: 'GBP' });
  });
});

describe('bankersRound', () => {
  it.each([
    [0.5, 0],
    [1.5, 2],
    [2.5, 2],
    [3.5, 4],
    [-0.5, 0],
    [-1.5, -2],
    [1.4, 1],
    [1.6, 2],
  ])('bankersRound(%s) = %s', (input, expected) => {
    expect(bankersRound(input)).toBe(expected);
  });
});
