import { describe, expect, it } from 'vitest';
import { calculate, listYears, sweep } from './calculate.js';
import { Money } from './money.js';
import { year } from './year.js';

const Y = year(2026);

describe('calculate', () => {
  it('delegates to the region pipeline and returns a Breakdown', () => {
    const b = calculate({
      regionId: 'uk-eng',
      year: Y,
      grossAnnual: new Money(30_000_00, 'GBP'),
    });
    expect(b.gross.amount).toBe(30_000_00);
    expect(b.net.amount).toBe(25_119_60);
    expect(b.deductions.length).toBeGreaterThan(0);
  });
});

describe('sweep', () => {
  it('produces one breakdown per step from..to inclusive', () => {
    const results = sweep(
      { regionId: 'uk-eng', year: Y },
      {
        from: Money.zero('GBP'),
        to: new Money(30_000_00, 'GBP'),
        step: new Money(10_000_00, 'GBP'),
      },
    );
    expect(results).toHaveLength(4);
    expect(results.map((r) => r.gross.amount)).toEqual([0, 10_000_00, 20_000_00, 30_000_00]);
    // Net is monotonic non-decreasing in gross.
    for (let i = 1; i < results.length; i++) {
      expect(results[i]!.net.amount).toBeGreaterThanOrEqual(results[i - 1]!.net.amount);
    }
  });

  it('returns a single breakdown when from == to', () => {
    const results = sweep(
      { regionId: 'us-ca', year: Y },
      {
        from: new Money(50_000_00, 'USD'),
        to: new Money(50_000_00, 'USD'),
        step: new Money(1_000_00, 'USD'),
      },
    );
    expect(results).toHaveLength(1);
    expect(results[0]!.gross.amount).toBe(50_000_00);
  });

  it('stops before overshooting to when step does not divide the range evenly', () => {
    const results = sweep(
      { regionId: 'uk-eng', year: Y },
      {
        from: new Money(0, 'GBP'),
        to: new Money(25_000_00, 'GBP'),
        step: new Money(10_000_00, 'GBP'),
      },
    );
    expect(results.map((r) => r.gross.amount)).toEqual([0, 10_000_00, 20_000_00]);
  });

  it('throws when currencies disagree across from/to/step', () => {
    expect(() =>
      sweep(
        { regionId: 'uk-eng', year: Y },
        {
          from: Money.zero('GBP'),
          to: new Money(10_000_00, 'USD'),
          step: new Money(1_000_00, 'GBP'),
        },
      ),
    ).toThrow(TypeError);
    expect(() =>
      sweep(
        { regionId: 'uk-eng', year: Y },
        {
          from: Money.zero('GBP'),
          to: new Money(10_000_00, 'GBP'),
          step: new Money(1_000_00, 'USD'),
        },
      ),
    ).toThrow(TypeError);
  });

  it('throws when step is zero or negative', () => {
    expect(() =>
      sweep(
        { regionId: 'uk-eng', year: Y },
        {
          from: Money.zero('GBP'),
          to: new Money(10_000_00, 'GBP'),
          step: Money.zero('GBP'),
        },
      ),
    ).toThrow(RangeError);
  });

  it('throws when from > to', () => {
    expect(() =>
      sweep(
        { regionId: 'uk-eng', year: Y },
        {
          from: new Money(10_000_00, 'GBP'),
          to: Money.zero('GBP'),
          step: new Money(1_000_00, 'GBP'),
        },
      ),
    ).toThrow(RangeError);
  });
});

describe('listYears', () => {
  it('returns the supported years for each region', () => {
    expect(listYears('uk-eng')).toEqual([2026]);
    expect(listYears('us-ca')).toEqual([2026]);
    expect(listYears('us-ny')).toEqual([2026]);
    expect(listYears('us-wa')).toEqual([2026]);
    expect(listYears('us-tx')).toEqual([2026]);
  });
});
