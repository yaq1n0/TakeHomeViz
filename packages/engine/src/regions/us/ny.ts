import type { Region } from '../../types.js';
import { us401kPretax } from './federal/deductions/401k.js';
import { usFederalIncomeTax } from './federal/deductions/income-tax.js';
import { usFICA } from './federal/deductions/fica.js';
import { usFederalStudentLoan } from './federal/deductions/student-loan.js';
import { nyStateIncomeTax } from './states/ny/deductions/income-tax.js';
import { nySDI } from './states/ny/deductions/sdi.js';

/**
 * US — New York region pipeline.
 *
 * Pipeline order (per PLAN.md §5.2):
 *   1. 401(k) pre-tax
 *   2. Federal income tax
 *   3. NY state income tax
 *   4. FICA (computed on gross, ignores 401(k))
 *   5. NY SDI — flat annual cap ($31.20)
 *   6. Federal student loan — v1.1 stub
 *
 * NYC / Yonkers surcharges are NOT modeled; flagged as a known gap per PLAN.md §3.
 *
 * @example
 *   calculate({ regionId: 'us-ny', year: year(2026), grossAnnual: new Money(150_000_00, 'USD') });
 */
export const usNewYork: Region = {
  id: 'us-ny',
  label: 'US — New York',
  currency: 'USD',
  pipeline: (year) => [
    us401kPretax,
    usFederalIncomeTax(year),
    nyStateIncomeTax(year),
    usFICA(year),
    nySDI(year),
    usFederalStudentLoan(year),
  ],
};
