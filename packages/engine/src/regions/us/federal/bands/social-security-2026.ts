import type { BandSchedule } from '../../../../types.js';

/**
 * US Social Security payroll tax, 2026. Flat 6.2% on wages up to the Social
 * Security wage base. Above the cap, zero.
 *
 * Modeled as a two-band schedule where the top band has rate 0. This keeps the
 * cap visible in the data rather than hiding it in a deduction function.
 *
 * 2026 wage base is projected at $174,900 (the 2025 base was $168,600). SSA
 * publishes the final figure in mid-October of the prior year.
 *
 * TODO(yaqin): verify — 2026 SS wage base projected; confirm against
 * https://www.ssa.gov/oact/cola/cbb.html once published.
 *
 * @example
 *   import { applyBands } from '../../../../bands.js';
 *   import { Money } from '../../../../money.js';
 *   applyBands(new Money(100_000_00, 'USD'), usSocialSecurity2026, 'USD');
 *   //  6.2% × 100,000 = 6,200
 *   applyBands(new Money(300_000_00, 'USD'), usSocialSecurity2026, 'USD');
 *   //  6.2% × 174,900 = 10,843.80 (cap applies)
 */
export const SOCIAL_SECURITY_WAGE_BASE_2026 = 174_900_00;

export const usSocialSecurity2026: BandSchedule = {
  source: 'https://www.ssa.gov/oact/cola/cbb.html',
  effectiveFrom: '2026-01-01',
  bands: [
    { from: 0, to: SOCIAL_SECURITY_WAGE_BASE_2026, rate: 0.062 },
    { from: SOCIAL_SECURITY_WAGE_BASE_2026, to: Infinity, rate: 0.0 },
  ],
};
