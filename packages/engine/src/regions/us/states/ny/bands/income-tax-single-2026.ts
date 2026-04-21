import type { BandSchedule } from '../../../../../types.js';

/**
 * New York State personal income tax bands, single filer, tax year 2026.
 *
 * 2026 figures are projected from 2025 (NY DTF publishes annual inflation
 * adjustments; figures here use the 2025 brackets pending publication).
 *
 * NYC / Yonkers local surcharges are OUT OF SCOPE for v1 per PLAN.md §3.
 *
 * TODO(yaqin): verify — 2026 NY brackets projected from 2025; confirm
 * against https://www.tax.ny.gov/pit/file/tax_tables.htm once published.
 *
 * @example
 *   import { applyBands } from '../../../../../bands.js';
 *   import { Money } from '../../../../../money.js';
 *   // NY taxable income of $100,000
 *   applyBands(new Money(100_000_00, 'USD'), nyIncomeTaxSingle2026, 'USD');
 *   //   4.00% × 8,500                 =   340.00
 *   //   4.50% × (11,700 − 8,500)      =   144.00
 *   //   5.25% × (13,900 − 11,700)     =   115.50
 *   //   5.50% × (80,650 − 13,900)     = 3,671.25
 *   //   6.00% × (100,000 − 80,650)    = 1,161.00
 *   //   total                         = 5,431.75
 */
export const nyIncomeTaxSingle2026: BandSchedule = {
  source: 'https://www.tax.ny.gov/pit/file/tax_tables.htm',
  effectiveFrom: '2026-01-01',
  bands: [
    { from: 0, to: 8_500_00, rate: 0.04 },
    { from: 8_500_00, to: 11_700_00, rate: 0.045 },
    { from: 11_700_00, to: 13_900_00, rate: 0.0525 },
    { from: 13_900_00, to: 80_650_00, rate: 0.055 },
    { from: 80_650_00, to: 215_400_00, rate: 0.06 },
    { from: 215_400_00, to: 1_077_550_00, rate: 0.0685 },
    { from: 1_077_550_00, to: 5_000_000_00, rate: 0.0965 },
    { from: 5_000_000_00, to: 25_000_000_00, rate: 0.103 },
    { from: 25_000_000_00, to: Infinity, rate: 0.109 },
  ],
};
