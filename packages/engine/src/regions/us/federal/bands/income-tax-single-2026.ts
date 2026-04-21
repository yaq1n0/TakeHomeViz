import type { BandSchedule } from '../../../../types.js';

/**
 * US federal income tax bands, single filer, tax year 2026.
 *
 * Bands apply to **taxable income** — i.e. gross wages minus the standard
 * deduction (and minus 401(k) pre-tax contributions, modeled upstream in the
 * pipeline). Not to gross.
 *
 * 2026 figures are projections; the IRS typically publishes inflation-adjusted
 * figures in Rev. Proc. issued in late autumn of the prior year.
 *
 * TODO(yaqin): verify — projected from IRS Rev. Proc. 2024-40 (2025 figures)
 * with a modest inflation bump. 2026 figures will be finalised in late 2025.
 *
 * @example
 *   import { applyBands } from '../../../../bands.js';
 *   import { Money } from '../../../../money.js';
 *   // taxable income = $85,000 (after standard deduction)
 *   applyBands(new Money(85_000_00, 'USD'), usFederalIncomeTaxSingle2026, 'USD');
 *   //  10% on first 11,925          = 1,192.50
 *   //  12% on (48,475 − 11,925)     = 4,386.00
 *   //  22% on (85,000 − 48,475)     = 8,035.50
 *   //  total = 13,614.00
 *   // => Money { amount: 13_614_00, currency: 'USD' }
 */
export const usFederalIncomeTaxSingle2026: BandSchedule = {
  source: 'https://www.irs.gov/forms-pubs/about-publication-17',
  effectiveFrom: '2026-01-01',
  bands: [
    { from: 0, to: 11_925_00, rate: 0.1 },
    { from: 11_925_00, to: 48_475_00, rate: 0.12 },
    { from: 48_475_00, to: 103_350_00, rate: 0.22 },
    { from: 103_350_00, to: 197_300_00, rate: 0.24 },
    { from: 197_300_00, to: 250_525_00, rate: 0.32 },
    { from: 250_525_00, to: 626_350_00, rate: 0.35 },
    { from: 626_350_00, to: Infinity, rate: 0.37 },
  ],
};
