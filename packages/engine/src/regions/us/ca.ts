import type { Region } from '../../types.js';
import { us401kPretax } from './federal/deductions/401k.js';
import { usFederalIncomeTax } from './federal/deductions/income-tax.js';
import { usFICA } from './federal/deductions/fica.js';
import { usFederalStudentLoan } from './federal/deductions/student-loan.js';
import { caStateIncomeTax } from './states/ca/deductions/income-tax.js';
import { caSDI } from './states/ca/deductions/sdi.js';

/**
 * US — California region pipeline.
 *
 * Pipeline order (per PLAN.md §5.2):
 *   1. 401(k) pre-tax — reduces base for federal + state income tax (not FICA)
 *   2. Federal income tax — single filer, standard deduction applied internally
 *   3. CA state income tax — single filer, CA standard deduction applied
 *   4. FICA — Social Security + Medicare + Additional Medicare, computed on gross
 *   5. CA SDI — flat % on gross (no cap from 2024 onward)
 *   6. Federal student loan — v1.1 stub (zero)
 *
 * @example
 *   import { calculate, Money, year } from '@takehomeviz/engine';
 *   const b = calculate({
 *     regionId: 'us-ca',
 *     year: year(2026),
 *     grossAnnual: new Money(150_000_00, 'USD'),
 *     pensionPct: 5,
 *   });
 */
export const usCalifornia: Region = {
  id: 'us-ca',
  label: 'US — California',
  currency: 'USD',
  pipeline: (year) => [
    us401kPretax,
    usFederalIncomeTax(year),
    caStateIncomeTax(year),
    usFICA(year),
    caSDI(year),
    usFederalStudentLoan(year),
  ],
};
