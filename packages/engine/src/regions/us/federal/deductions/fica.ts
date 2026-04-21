import { applyBands } from '../../../../bands.js';
import type { Deduction } from '../../../../types.js';
import type { Year } from '../../../../year.js';
import { usAdditionalMedicare2026 } from '../bands/additional-medicare-2026.js';
import { usMedicare2026 } from '../bands/medicare-2026.js';
import { usSocialSecurity2026 } from '../bands/social-security-2026.js';

/**
 * US FICA (Social Security + Medicare + Additional Medicare) employee-side
 * payroll tax.
 *
 * Critical: FICA runs against **gross wages**, NOT against the 401(k)-reduced
 * base. Per IRC §3121(v)(1), 401(k) elective deferrals are subject to FICA.
 * So this deduction reads `ctx.grossAnnual` directly and ignores the incoming
 * taxableBase (which may already have had 401(k) subtracted upstream).
 *
 * Leaves `taxableBaseAfter` equal to the incoming base — FICA does not affect
 * what downstream deductions see (e.g. state SDI, student loan).
 *
 * Combines three schedules:
 *   - Social Security: 6.2% up to wage-base cap (2026 projected $174,900)
 *   - Medicare:        1.45% on all wages, no cap
 *   - Additional Medicare: 0.9% on wages above $200,000 single (ACA, fixed)
 *
 * @example
 *   // $250,000 gross
 *   //  SS: 6.2% × 174,900                  = 10,843.80
 *   //  Medicare: 1.45% × 250,000            =  3,625.00
 *   //  Add'l Medicare: 0.9% × (250k − 200k) =    450.00
 *   //  total FICA                           = 14,918.80
 */
export function usFICA(year: Year): Deduction {
  if (year !== 2026) {
    throw new Error(`usFICA: year ${year} not supported (only 2026)`);
  }
  const ssSchedule = usSocialSecurity2026;
  const medSchedule = usMedicare2026;
  const addMedSchedule = usAdditionalMedicare2026;

  return (taxableBase, ctx) => {
    // FICA is computed on gross wages, not on the pension-reduced base.
    const gross = ctx.grossAnnual;
    const ss = applyBands(gross, ssSchedule, 'USD').total;
    const med = applyBands(gross, medSchedule, 'USD').total;
    const addMed = applyBands(gross, addMedSchedule, 'USD').total;
    const total = ss.add(med).add(addMed);
    return {
      name: 'fica',
      amount: total,
      taxableBaseAfter: taxableBase,
      meta: {
        socialSecurity: ss.amount,
        medicare: med.amount,
        additionalMedicare: addMed.amount,
      },
    };
  };
}
