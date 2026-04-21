import { Money } from '../../../../money.js';
import type { Deduction } from '../../../../types.js';

/**
 * US 401(k) pre-tax employee elective deferral limit for 2026 (projected).
 *
 * 2025 limit was $23,000 (IRS Notice 2024-80). Projected ~$23,500 for 2026 —
 * the IRS adjusts this figure annually for inflation under IRC §402(g).
 *
 * TODO(yaqin): verify — 2026 401(k) elective deferral limit; IRS typically
 * announces in late October/November of the prior year.
 */
export const US_401K_ELECTIVE_DEFERRAL_LIMIT_2026 = 23_500_00;

/**
 * US 401(k) pre-tax contribution deduction.
 *
 * Reduces the taxable base for subsequent federal and state income tax
 * calculations, but **does not** reduce the base for FICA — per IRC
 * §3121(v)(1). Downstream deductions (FICA) should reference
 * `scenario.grossAnnual` directly.
 *
 * Contribution is `pensionPct % × gross`, capped at the annual elective
 * deferral limit. Employer match is not modeled (v1 non-goal per PLAN.md §3).
 *
 * @example
 *   // $200,000 gross, 10% deferral
 *   //  10% × 200,000 = 20,000 (under the 23,500 cap)
 *   // → taxableBaseAfter = 180,000
 */
export const us401kPretax: Deduction = (taxableBase, ctx) => {
  const pct = ctx.pensionPct ?? 0;
  const gross = ctx.grossAnnual;
  if (pct <= 0) {
    return {
      name: '401k-pretax',
      amount: Money.zero(gross.currency),
      taxableBaseAfter: taxableBase,
      meta: { pensionPct: 0 },
    };
  }
  if (pct > 100) {
    throw new RangeError(`pensionPct must be in [0, 100], got ${pct}`);
  }
  const uncapped = gross.mul(pct / 100);
  const cap = new Money(US_401K_ELECTIVE_DEFERRAL_LIMIT_2026, gross.currency);
  const contribution = Money.min(uncapped, cap);
  return {
    name: '401k-pretax',
    amount: contribution,
    taxableBaseAfter: taxableBase.sub(contribution),
    meta: { pensionPct: pct, cap: cap.amount },
  };
};
