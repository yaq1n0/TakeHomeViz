import type { BandSchedule } from '../../../../../types.js';

/**
 * California personal income tax bands, single filer, tax year 2026.
 *
 * 2026 figures are projected from 2025 (CA FTB typically publishes the
 * inflation-adjusted brackets in late summer). Using 2025 brackets pending
 * publication.
 *
 * Mental Health Services Tax (Prop 63) is handled as a modifier: an extra 1%
 * on the portion of taxable income above $1,000,000.
 *
 * TODO(yaqin): verify — 2026 CA brackets projected from 2025; confirm against
 * https://www.ftb.ca.gov/ once published.
 *
 * @example
 *   import { applyBands } from '../../../../../bands.js';
 *   import { Money } from '../../../../../money.js';
 *   // taxable income $50,000 (post CA standard deduction)
 *   applyBands(new Money(50_000_00, 'USD'), caIncomeTaxSingle2026, 'USD');
 *   //  1% × 10,756           =   107.56
 *   //  2% × (25,499−10,756)  =   294.86
 *   //  4% × (40,245−25,499)  =   589.84
 *   //  6% × (50,000−40,245)  =   585.30
 *   //  total ≈ 1,577.56
 */

const MHST_THRESHOLD = 1_000_000_00;

/**
 * Mental Health Services Tax (Prop 63, 2004) — 1% surcharge on the portion of
 * taxable income above $1,000,000. Source: CA Rev. & Tax. Code §17043.
 */
function mentalHealthServicesTax(amountDue: number, taxableBase: number): number {
  if (taxableBase <= MHST_THRESHOLD) return amountDue;
  const excess = taxableBase - MHST_THRESHOLD;
  return amountDue + excess * 0.01;
}

export const caIncomeTaxSingle2026: BandSchedule = {
  source: 'https://www.ftb.ca.gov/file/personal/tax-calculator-tables-rates.html',
  effectiveFrom: '2026-01-01',
  bands: [
    { from: 0, to: 10_756_00, rate: 0.01 },
    { from: 10_756_00, to: 25_499_00, rate: 0.02 },
    { from: 25_499_00, to: 40_245_00, rate: 0.04 },
    { from: 40_245_00, to: 55_866_00, rate: 0.06 },
    { from: 55_866_00, to: 70_606_00, rate: 0.08 },
    { from: 70_606_00, to: 360_659_00, rate: 0.093 },
    { from: 360_659_00, to: 432_787_00, rate: 0.103 },
    { from: 432_787_00, to: 721_314_00, rate: 0.113 },
    { from: 721_314_00, to: Infinity, rate: 0.123 },
  ],
  modifiers: [mentalHealthServicesTax],
};
