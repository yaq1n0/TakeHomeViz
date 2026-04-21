import { Money } from './money.js';
import type { Currency } from './money.js';
import type { BandSchedule } from './types.js';

/**
 * Apply a band schedule to a taxable amount, returning the total due. The
 * returned Money is rounded to integer minor units via banker's rounding.
 *
 * @example
 *   const schedule: BandSchedule = {
 *     source: 'https://www.gov.uk/income-tax-rates',
 *     effectiveFrom: '2026-04-06',
 *     bands: [
 *       { from: 0,         to: 12_570_00,  rate: 0.00 },
 *       { from: 12_570_00, to: 50_270_00,  rate: 0.20 },
 *       { from: 50_270_00, to: Infinity,   rate: 0.40 },
 *     ],
 *   };
 *   applyBands(new Money(60_000_00, 'GBP'), schedule, 'GBP');
 *   // => Money { amount: 11_432_00, currency: 'GBP' }   (7,540 + 3,892)
 */
export function applyBands(
  taxable: Money,
  schedule: BandSchedule,
  currency: Currency,
): { total: Money; bandBreakdown: BandResult[] } {
  if (taxable.currency !== currency) {
    throw new TypeError(`applyBands: currency mismatch (${taxable.currency} vs ${currency})`);
  }
  const amount = taxable.amount;
  if (amount <= 0) {
    return { total: Money.zero(currency), bandBreakdown: [] };
  }

  let due = 0;
  const breakdown: BandResult[] = [];

  for (const band of schedule.bands) {
    if (amount <= band.from) break;
    const top = Math.min(amount, band.to);
    const portion = top - band.from;
    if (portion <= 0) continue;
    const taxOnBand = portion * band.rate;
    due += taxOnBand;
    breakdown.push({
      from: band.from,
      to: band.to,
      rate: band.rate,
      taxable: portion,
      tax: taxOnBand,
    });
    if (amount <= band.to) break;
  }

  if (schedule.modifiers) {
    for (const modifier of schedule.modifiers) {
      due = modifier(due, amount);
    }
  }

  const rounded = Math.round(due);
  return { total: new Money(rounded, currency), bandBreakdown: breakdown };
}

export interface BandResult {
  from: number;
  to: number;
  rate: number;
  /** Portion of taxable base that fell into this band, in minor units. */
  taxable: number;
  /** Pre-rounding tax due on this band, in minor units. */
  tax: number;
}

/**
 * Compute the marginal rate on the *next* unit of income at the given taxable
 * base. Sum of rates across all schedules that would see this extra unit.
 */
export function marginalRateAt(taxableBase: number, schedules: BandSchedule[]): number {
  let rate = 0;
  for (const schedule of schedules) {
    const band = schedule.bands.find((b) => taxableBase >= b.from && taxableBase < b.to);
    if (band) rate += band.rate;
  }
  return rate;
}
