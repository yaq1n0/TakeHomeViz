import { Money } from '../../../../money.js';
import type { Deduction } from '../../../../types.js';
import type { Year } from '../../../../year.js';

/**
 * US federal student loan repayment — **v1.1 stub**.
 *
 * Federal income-driven repayment (IBR, PAYE, SAVE, ICR) plans require
 * family-size and discretionary-income inputs that we don't model in v1
 * (PLAN.md §3). This deduction returns zero so the pipeline still has a slot
 * for it — v1.1 will swap in a real implementation once the required Scenario
 * fields are added.
 *
 * TODO(yaqin): verify — federal IBR needs family-size + discretionary-income;
 * deferred to v1.1 per PLAN.md §3.
 *
 * @example
 *   // any scenario → amount: $0, base unchanged
 */
export function usFederalStudentLoan(_year: Year): Deduction {
  return (taxableBase) => ({
    name: 'federal-student-loan',
    amount: Money.zero('USD'),
    taxableBaseAfter: taxableBase,
    meta: { stub: true, deferredTo: 'v1.1' },
  });
}
