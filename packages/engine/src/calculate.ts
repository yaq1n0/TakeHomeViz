import { Money } from './money.js';
import { runPipeline } from './pipeline.js';
import { getRegion, listRegions } from './regions/index.js';
import type { Breakdown, RegionId, Scenario } from './types.js';

/**
 * Calculate take-home pay for a single scenario.
 *
 * @example
 *   import { calculate, Money, year } from '@takehomeviz/engine';
 *
 *   const breakdown = calculate({
 *     regionId: 'uk-eng',
 *     year: year(2026),
 *     grossAnnual: new Money(50_000_00, 'GBP'),
 *     pensionPct: 5,
 *   });
 *   console.log(breakdown.net.toString()); // "£38,xxx.xx"
 */
export function calculate(scenario: Scenario): Breakdown {
  const region = getRegion(scenario.regionId);
  return runPipeline(scenario, region);
}

export { listRegions };

/**
 * Sweep the gross-salary range, computing a breakdown at each step. Feeds the
 * gross-vs-spendable graph directly.
 *
 * @example
 *   sweep(
 *     { regionId: 'uk-eng', year: year(2026), pensionPct: 5 },
 *     { from: Money.zero('GBP'), to: new Money(200_000_00, 'GBP'), step: new Money(1_000_00, 'GBP') },
 *   );
 */
export function sweep(
  base: Omit<Scenario, 'grossAnnual'>,
  range: { from: Money; to: Money; step: Money },
): Breakdown[] {
  if (range.from.currency !== range.to.currency || range.from.currency !== range.step.currency) {
    throw new TypeError('sweep: from/to/step must share currency');
  }
  if (range.step.amount <= 0) {
    throw new RangeError('sweep: step must be positive');
  }
  if (range.from.amount > range.to.amount) {
    throw new RangeError('sweep: from must be ≤ to');
  }

  const results: Breakdown[] = [];
  let g = range.from.amount;
  while (g <= range.to.amount) {
    const scenario: Scenario = {
      ...base,
      grossAnnual: new Money(g, range.from.currency),
    };
    results.push(calculate(scenario));
    g += range.step.amount;
  }
  return results;
}

/**
 * Convenience: list tax years supported by a region.
 */
export function listYears(regionId: RegionId): number[] {
  return getRegion(regionId).pipeline.length > 0 ? Array.from(SUPPORTED_YEARS[regionId] ?? []) : [];
}

export const SUPPORTED_YEARS: Record<RegionId, number[]> = {
  'uk-eng': [2026],
  'us-ca': [2026],
  'us-ny': [2026],
  'us-wa': [2026],
  'us-tx': [2026],
};
