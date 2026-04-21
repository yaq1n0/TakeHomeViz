/**
 * Property-based invariants that every region must satisfy. Per PLAN.md §8,
 * these catch regressions that hand-written reference scenarios miss.
 */

import fc from 'fast-check';
import { describe, it } from 'vitest';
import { calculate } from './calculate.js';
import { Money } from './money.js';
import { listRegions } from './regions/index.js';
import type { RegionId, Scenario } from './types.js';
import { year } from './year.js';

const Y = year(2026);
const REGION_CURRENCY: Record<RegionId, 'GBP' | 'USD'> = {
  'uk-eng': 'GBP',
  'us-ca': 'USD',
  'us-ny': 'USD',
  'us-wa': 'USD',
  'us-tx': 'USD',
};

const regions = listRegions().map((r) => r.id);

// Gross: £/$0 to £/$1,000,000 (100_000_000 minor units).
const grossArb = fc.integer({ min: 0, max: 100_000_000 }).map((n) => n - (n % 100)); // round to whole units
const pensionArb = fc.option(fc.integer({ min: 0, max: 50 }), { nil: undefined });

function scenarioFor(regionId: RegionId, grossMinor: number, pensionPct?: number): Scenario {
  return {
    regionId,
    year: Y,
    grossAnnual: new Money(grossMinor, REGION_CURRENCY[regionId]),
    ...(pensionPct !== undefined ? { pensionPct } : {}),
  };
}

describe('invariants across all regions', () => {
  for (const regionId of regions) {
    describe(regionId, () => {
      it('monotonicity: gross ↑ ⇒ net ↑ (weakly)', () => {
        fc.assert(
          fc.property(grossArb, grossArb, pensionArb, (aMinor, bMinor, pct) => {
            const low = Math.min(aMinor, bMinor);
            const high = Math.max(aMinor, bMinor);
            const netLow = calculate(scenarioFor(regionId, low, pct)).net.amount;
            const netHigh = calculate(scenarioFor(regionId, high, pct)).net.amount;
            return netHigh >= netLow;
          }),
          { numRuns: 40 },
        );
      });

      it('sum of deductions never exceeds gross', () => {
        fc.assert(
          fc.property(grossArb, pensionArb, (grossMinor, pct) => {
            const b = calculate(scenarioFor(regionId, grossMinor, pct));
            const totalDeductions = b.deductions.reduce((acc, d) => acc + d.amount.amount, 0);
            return totalDeductions <= b.gross.amount;
          }),
          { numRuns: 50 },
        );
      });

      it('each deduction amount is non-negative', () => {
        fc.assert(
          fc.property(grossArb, pensionArb, (grossMinor, pct) => {
            const b = calculate(scenarioFor(regionId, grossMinor, pct));
            return b.deductions.every((d) => d.amount.amount >= 0);
          }),
          { numRuns: 50 },
        );
      });

      it('calculate is idempotent', () => {
        fc.assert(
          fc.property(grossArb, pensionArb, (grossMinor, pct) => {
            const s = scenarioFor(regionId, grossMinor, pct);
            const a = calculate(s);
            const b = calculate(s);
            return a.net.eq(b.net) && a.gross.eq(b.gross);
          }),
          { numRuns: 20 },
        );
      });

      it('net = gross − Σ deductions exactly', () => {
        fc.assert(
          fc.property(grossArb, pensionArb, (grossMinor, pct) => {
            const b = calculate(scenarioFor(regionId, grossMinor, pct));
            const expected = b.deductions.reduce((acc, d) => acc - d.amount.amount, b.gross.amount);
            return expected === b.net.amount;
          }),
          { numRuns: 30 },
        );
      });
    });
  }
});

describe('marginalRate is in [0, 1]', () => {
  for (const regionId of regions) {
    it(regionId, () => {
      fc.assert(
        fc.property(grossArb, (grossMinor) => {
          const b = calculate(scenarioFor(regionId, grossMinor));
          return b.marginalRate >= 0 && b.marginalRate <= 1;
        }),
        { numRuns: 30 },
      );
    });
  }
});
