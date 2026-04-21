import { applyBands } from '../../../../../bands.js';
import { Money } from '../../../../../money.js';
import type { Deduction } from '../../../../../types.js';
import type { Year } from '../../../../../year.js';
import { nyIncomeTaxSingle2026 } from '../bands/income-tax-single-2026.js';

/**
 * New York State standard deduction, single filer, 2026 (projected).
 *
 * 2025 figure was $8,000 — NY has held this flat for a while.
 *
 * TODO(yaqin): verify — 2026 NY standard deduction. Note NY uses a "tax
 * benefit recapture" for very high incomes (supplemental tax) that we do NOT
 * model here; flagged as known gap for v1.
 */
export const nyStandardDeductionSingle2026 = new Money(8_000_00, 'USD');

/**
 * New York State income tax (single filer).
 *
 * Same contract as federal / CA: sees the 401(k)-reduced base, subtracts the
 * NY standard deduction, applies the band schedule, leaves the taxable base
 * unchanged for downstream deductions.
 *
 * @example
 *   // $150,000 gross, 0% 401(k) → taxableBase = $150,000
 *   // NY taxable income = 150,000 − 8,000 = 142,000
 *   // NY tax on 142,000 (stepping through the bands):
 *   //   4.00% × 8,500                        =   340.00
 *   //   4.50% × (11,700 − 8,500)             =   144.00
 *   //   5.25% × (13,900 − 11,700)            =   115.50
 *   //   5.50% × (80,650 − 13,900)            = 3,671.25
 *   //   6.00% × (142,000 − 80,650)           = 3,681.00
 *   //   total                                = 7,951.75
 */
export function nyStateIncomeTax(year: Year): Deduction {
  if (year !== 2026) {
    throw new Error(`nyStateIncomeTax: year ${year} not supported (only 2026)`);
  }
  const schedule = nyIncomeTaxSingle2026;
  const standardDeduction = nyStandardDeductionSingle2026;

  return (taxableBase) => {
    const taxableIncome = Money.max(taxableBase.sub(standardDeduction), Money.zero('USD'));
    const { total, bandBreakdown } = applyBands(taxableIncome, schedule, 'USD');
    return {
      name: 'ny-state-income-tax',
      amount: total,
      taxableBaseAfter: taxableBase,
      meta: {
        taxableIncome: taxableIncome.amount,
        standardDeduction: standardDeduction.amount,
        bandBreakdown,
      },
    };
  };
}
