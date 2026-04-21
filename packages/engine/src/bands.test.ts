import { describe, expect, it } from 'vitest';
import { applyBands, marginalRateAt } from './bands.js';
import { Money } from './money.js';
import type { BandSchedule } from './types.js';

const ukIshSchedule: BandSchedule = {
  source: 'test',
  effectiveFrom: '2026-04-06',
  bands: [
    { from: 0, to: 12_570_00, rate: 0.0 },
    { from: 12_570_00, to: 50_270_00, rate: 0.2 },
    { from: 50_270_00, to: 125_140_00, rate: 0.4 },
    { from: 125_140_00, to: Infinity, rate: 0.45 },
  ],
};

describe('applyBands', () => {
  it('returns zero for zero/negative taxable', () => {
    expect(applyBands(Money.zero('GBP'), ukIshSchedule, 'GBP').total.amount).toBe(0);
    expect(applyBands(new Money(-100, 'GBP'), ukIshSchedule, 'GBP').total.amount).toBe(0);
  });

  it('computes UK-ish tax at £60,000', () => {
    // PA: 0, basic: (50,270 − 12,570) * 0.20 = 7,540, higher: (60,000 − 50,270) * 0.40 = 3,892
    // total = 11,432
    const { total } = applyBands(new Money(60_000_00, 'GBP'), ukIshSchedule, 'GBP');
    expect(total.amount).toBe(11_432_00);
  });

  it('computes UK-ish tax at £200,000', () => {
    // Basic: 37,700 * 0.20 = 7,540
    // Higher: (125,140 − 50,270) * 0.40 = 29,948
    // Additional: (200,000 − 125,140) * 0.45 = 33,687
    // Total: 71,175
    const { total } = applyBands(new Money(200_000_00, 'GBP'), ukIshSchedule, 'GBP');
    expect(total.amount).toBe(71_175_00);
  });

  it('rejects currency mismatch', () => {
    expect(() => applyBands(new Money(100, 'USD'), ukIshSchedule, 'GBP')).toThrow(/mismatch/);
  });

  it('applies modifiers', () => {
    const schedule: BandSchedule = {
      ...ukIshSchedule,
      modifiers: [(due) => due + 100_00], // add £100 flat
    };
    const { total } = applyBands(new Money(60_000_00, 'GBP'), schedule, 'GBP');
    expect(total.amount).toBe(11_432_00 + 100_00);
  });

  it('produces a breakdown matching the bands touched', () => {
    const { bandBreakdown } = applyBands(new Money(60_000_00, 'GBP'), ukIshSchedule, 'GBP');
    expect(bandBreakdown).toHaveLength(3);
    expect(bandBreakdown[0]?.rate).toBe(0);
    expect(bandBreakdown[1]?.rate).toBe(0.2);
    expect(bandBreakdown[2]?.rate).toBe(0.4);
  });
});

describe('marginalRateAt', () => {
  it('sums rates across stacked schedules', () => {
    const a: BandSchedule = {
      source: 'test',
      effectiveFrom: '2026-04-06',
      bands: [{ from: 0, to: Infinity, rate: 0.2 }],
    };
    const b: BandSchedule = {
      source: 'test',
      effectiveFrom: '2026-04-06',
      bands: [{ from: 0, to: Infinity, rate: 0.1 }],
    };
    expect(marginalRateAt(50_000_00, [a, b])).toBeCloseTo(0.3);
  });

  it('returns 0 when above all bands', () => {
    const a: BandSchedule = {
      source: 'test',
      effectiveFrom: '2026-04-06',
      bands: [{ from: 0, to: 100, rate: 0.2 }],
    };
    expect(marginalRateAt(1_000, [a])).toBe(0);
  });
});
