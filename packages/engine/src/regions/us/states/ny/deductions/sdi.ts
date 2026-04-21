import { Money } from '../../../../../money.js';
import type { Deduction } from '../../../../../types.js';
import type { Year } from '../../../../../year.js';

/**
 * New York State SDI (State Disability Insurance).
 *
 * Employee contribution is capped at $0.60/week by statute — an annual maximum
 * of $31.20 (52 × $0.60). Modeled here as a flat annual deduction for any
 * scenario with positive gross wages.
 *
 * This is small enough that some tools ignore it; we include it for
 * completeness and so totals match the canonical paycheck calculators.
 *
 * TODO(yaqin): verify — NYS SDI $0.60/week cap remains in force for 2026.
 * NYS also runs a Paid Family Leave (PFL) payroll contribution which we
 * currently ignore (materially small; flagged for v1.1).
 *
 * Source: https://www.tax.ny.gov/ and NYS Workers' Compensation Board
 * (https://www.wcb.ny.gov/content/main/DisabilityBenefits/Employer/employerFAQ.jsp)
 *
 * @example
 *   // any positive gross → $31.20/yr
 */
export const NY_SDI_ANNUAL_MAX = 31_20;

export function nySDI(_year: Year): Deduction {
  return (taxableBase, ctx) => {
    const amount = ctx.grossAnnual.isPositive()
      ? new Money(NY_SDI_ANNUAL_MAX, 'USD')
      : Money.zero('USD');
    return {
      name: 'ny-sdi',
      amount,
      taxableBaseAfter: taxableBase,
      meta: { cappedAnnual: NY_SDI_ANNUAL_MAX },
    };
  };
}
