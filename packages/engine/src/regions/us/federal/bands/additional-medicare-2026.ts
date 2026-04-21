import type { BandSchedule } from '../../../../types.js';

/**
 * US Additional Medicare Tax, 2026. 0.9% on wages above $200,000 for single
 * filers. The threshold is NOT inflation-adjusted (fixed by statute — Additional
 * Medicare Tax introduced by the Affordable Care Act, IRC §3101(b)(2)).
 *
 * Source: https://www.irs.gov/businesses/small-businesses-self-employed/questions-and-answers-for-the-additional-medicare-tax
 *
 * @example
 *   import { applyBands } from '../../../../bands.js';
 *   import { Money } from '../../../../money.js';
 *   applyBands(new Money(250_000_00, 'USD'), usAdditionalMedicare2026, 'USD');
 *   //  0.9% × (250,000 − 200,000) = 450
 */
export const ADDITIONAL_MEDICARE_THRESHOLD_SINGLE = 200_000_00;

export const usAdditionalMedicare2026: BandSchedule = {
  source:
    'https://www.irs.gov/businesses/small-businesses-self-employed/questions-and-answers-for-the-additional-medicare-tax',
  effectiveFrom: '2013-01-01',
  bands: [
    { from: 0, to: ADDITIONAL_MEDICARE_THRESHOLD_SINGLE, rate: 0.0 },
    { from: ADDITIONAL_MEDICARE_THRESHOLD_SINGLE, to: Infinity, rate: 0.009 },
  ],
};
