import type { BandSchedule } from '../../../../types.js';

/**
 * US Medicare payroll tax (base portion), 2026. Flat 1.45% on all wages — no
 * cap. The *additional* 0.9% above $200,000 (single) is a separate schedule,
 * see `additional-medicare-2026.ts`.
 *
 * Source: https://www.irs.gov/taxtopics/tc751
 *
 * @example
 *   import { applyBands } from '../../../../bands.js';
 *   import { Money } from '../../../../money.js';
 *   applyBands(new Money(100_000_00, 'USD'), usMedicare2026, 'USD');
 *   //  1.45% × 100,000 = 1,450
 */
export const usMedicare2026: BandSchedule = {
  source: 'https://www.irs.gov/taxtopics/tc751',
  effectiveFrom: '2026-01-01',
  bands: [{ from: 0, to: Infinity, rate: 0.0145 }],
};
