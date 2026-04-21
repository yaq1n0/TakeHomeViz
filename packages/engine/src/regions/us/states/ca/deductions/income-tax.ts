import { applyBands } from '../../../../../bands.js';
import { Money } from '../../../../../money.js';
import type { Deduction } from '../../../../../types.js';
import type { Year } from '../../../../../year.js';
import { caIncomeTaxSingle2026 } from '../bands/income-tax-single-2026.js';

/**
 * California standard deduction, single filer, 2026 (projected).
 *
 * 2025 was $5,540. Projected $5,500 (figure rounded; CA adjusts annually for
 * the California CPI).
 *
 * TODO(yaqin): verify — 2026 CA standard deduction from FTB.
 */
export const caStandardDeductionSingle2026 = new Money(5_500_00, 'USD');

/**
 * California state income tax (single filer).
 *
 * Sees the same taxable base that federal income tax did (gross − 401(k)).
 * Subtracts the CA standard deduction internally and applies the CA band
 * schedule with the Mental Health Services Tax modifier.
 *
 * Does NOT reduce the base for subsequent deductions — FICA and SDI that
 * follow read their own bases.
 *
 * @example
 *   // $100,000 gross, 5% 401(k) → taxableBase entering = $95,000
 *   // CA taxable income = 95,000 − 5,500 = 89,500
 *   // apply caIncomeTaxSingle2026 bands → ~$4,960 (varies with 2026 bands)
 */
export function caStateIncomeTax(year: Year): Deduction {
  if (year !== 2026) {
    throw new Error(`caStateIncomeTax: year ${year} not supported (only 2026)`);
  }
  const schedule = caIncomeTaxSingle2026;
  const standardDeduction = caStandardDeductionSingle2026;

  return (taxableBase) => {
    const taxableIncome = Money.max(taxableBase.sub(standardDeduction), Money.zero('USD'));
    const { total, bandBreakdown } = applyBands(taxableIncome, schedule, 'USD');
    return {
      name: 'ca-state-income-tax',
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
