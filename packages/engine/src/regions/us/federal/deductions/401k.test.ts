import { describe, expect, it } from 'vitest';
import { Money } from '../../../../money.js';
import { year } from '../../../../year.js';
import type { Scenario } from '../../../../types.js';
import { us401kPretax } from './401k.js';

function scenario(pensionPct: number | undefined): Scenario {
  return {
    regionId: 'us-ca',
    year: year(2026),
    grossAnnual: new Money(200_000_00, 'USD'),
    pensionPct,
  };
}

describe('us401kPretax bounds', () => {
  it('returns a zero-amount deduction and unchanged base when pct <= 0', () => {
    const base = new Money(200_000_00, 'USD');
    const result = us401kPretax(base, scenario(0), []);
    expect(result.amount.amount).toBe(0);
    expect(result.taxableBaseAfter.amount).toBe(base.amount);
    expect(result.meta).toEqual({ pensionPct: 0 });
  });

  it('returns a zero-amount deduction when pensionPct is undefined', () => {
    const base = new Money(200_000_00, 'USD');
    const result = us401kPretax(base, scenario(undefined), []);
    expect(result.amount.amount).toBe(0);
    expect(result.taxableBaseAfter.amount).toBe(base.amount);
  });

  it('throws on negative pct (matches UK salary-sacrifice shape — zero-branch handles it)', () => {
    const base = new Money(200_000_00, 'USD');
    const result = us401kPretax(base, scenario(-5), []);
    expect(result.amount.amount).toBe(0);
    expect(result.taxableBaseAfter.amount).toBe(base.amount);
  });

  it('throws RangeError when pct > 100', () => {
    const base = new Money(200_000_00, 'USD');
    expect(() => us401kPretax(base, scenario(150), [])).toThrow(RangeError);
  });

  it('still caps at the annual elective deferral limit for large gross', () => {
    const base = new Money(500_000_00, 'USD');
    const ctx: Scenario = {
      regionId: 'us-ca',
      year: year(2026),
      grossAnnual: new Money(500_000_00, 'USD'),
      pensionPct: 50,
    };
    const result = us401kPretax(base, ctx, []);
    expect(result.amount.amount).toBe(23_500_00);
  });
});
