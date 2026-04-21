import { applyBands } from '../../../../../bands.js';
import type { Deduction } from '../../../../../types.js';
import type { Year } from '../../../../../year.js';
import { caSdi2026 } from '../bands/sdi-2026.js';

/**
 * California SDI (State Disability Insurance) employee payroll deduction.
 *
 * Computed against **gross wages** (not the 401(k)-reduced base). As of 2024
 * the wage ceiling was removed by SB 951, so there is no cap — rate applies
 * to all wages.
 *
 * Leaves the taxable base unchanged for any downstream deduction.
 *
 * @example
 *   // $100,000 gross, regardless of 401(k) → 1.1% × 100,000 = $1,100
 */
export function caSDI(year: Year): Deduction {
  if (year !== 2026) {
    throw new Error(`caSDI: year ${year} not supported (only 2026)`);
  }
  const schedule = caSdi2026;
  return (taxableBase, ctx) => {
    const gross = ctx.grossAnnual;
    const { total } = applyBands(gross, schedule, 'USD');
    return {
      name: 'ca-sdi',
      amount: total,
      taxableBaseAfter: taxableBase,
    };
  };
}
