import type { BandSchedule } from '../../../../../types.js';

/**
 * California State Disability Insurance (SDI) payroll tax, 2026.
 *
 * As of 2024, California removed the SDI taxable wage ceiling (SB 951, 2022).
 * Rate applies to all wages. 2026 projected rate is 1.1% (2025 was 1.2%; the
 * EDD sets the rate annually — may change).
 *
 * TODO(yaqin): verify — 2026 CA SDI rate; EDD typically publishes in Q4 of
 * prior year. 2025 rate was 1.2%; 2026 projection here uses 1.1% but could go
 * either way. See https://edd.ca.gov/en/disability/sdi_calculations/
 *
 * @example
 *   import { applyBands } from '../../../../../bands.js';
 *   import { Money } from '../../../../../money.js';
 *   applyBands(new Money(100_000_00, 'USD'), caSdi2026, 'USD');
 *   //  1.1% × 100,000 = 1,100
 */
export const caSdi2026: BandSchedule = {
  source: 'https://edd.ca.gov/en/disability/sdi_calculations/',
  effectiveFrom: '2026-01-01',
  bands: [{ from: 0, to: Infinity, rate: 0.011 }],
};
