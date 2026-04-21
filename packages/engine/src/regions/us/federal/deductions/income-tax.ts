import { applyBands } from '../../../../bands.js';
import { Money } from '../../../../money.js';
import type { Deduction } from '../../../../types.js';
import type { Year } from '../../../../year.js';
import { usFederalIncomeTaxSingle2026 } from '../bands/income-tax-single-2026.js';
import { usFederalStandardDeduction2026 } from '../standard-deduction-2026.js';

/**
 * US federal income tax (single filer). Sees the incoming taxable base
 * (typically gross − 401(k)), subtracts the standard deduction, and applies
 * the federal band schedule for the given year.
 *
 * Does NOT reduce the base for subsequent deductions — the state income tax
 * that follows needs to see the same 401(k)-reduced base, and FICA runs
 * against gross. So `taxableBaseAfter` is left equal to the incoming base.
 *
 * @example
 *   // $100,000 gross, 5% 401(k) → taxableBase entering this deduction = $95,000
 *   // taxable income = 95,000 − 15,000 = 80,000
 *   // federal tax =  10% × 11,925
 *   //              + 12% × (48,475 − 11,925)
 *   //              + 22% × (80,000 − 48,475)
 *   //              = 1,192.50 + 4,386.00 + 6,935.50 = 12,514.00
 */
export function usFederalIncomeTax(year: Year): Deduction {
  // Single-filer only for v1 per PLAN.md §3. Year parameter is accepted for
  // interface symmetry and future band-schedule switching; currently only 2026
  // is supported.
  if (year !== 2026) {
    // TODO(yaqin): verify — add prior-year schedules when needed. For now,
    // only 2026 is wired up.
    throw new Error(`usFederalIncomeTax: year ${year} not supported (only 2026)`);
  }
  const schedule = usFederalIncomeTaxSingle2026;
  const standardDeduction = usFederalStandardDeduction2026;

  return (taxableBase) => {
    const taxableIncome = Money.max(taxableBase.sub(standardDeduction), Money.zero('USD'));
    const { total, bandBreakdown } = applyBands(taxableIncome, schedule, 'USD');
    return {
      name: 'federal-income-tax',
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
