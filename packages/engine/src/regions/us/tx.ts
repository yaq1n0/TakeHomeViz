import type { Region } from '../../types.js';
import { us401kPretax } from './federal/deductions/401k.js';
import { usFederalIncomeTax } from './federal/deductions/income-tax.js';
import { usFICA } from './federal/deductions/fica.js';
import { usFederalStudentLoan } from './federal/deductions/student-loan.js';

/**
 * US — Texas region pipeline.
 *
 * Texas has **no state income tax**, so the pipeline is federal-only:
 *   1. 401(k) pre-tax
 *   2. Federal income tax
 *   3. FICA (on gross)
 *   4. Federal student loan — v1.1 stub
 *
 * @example
 *   calculate({ regionId: 'us-tx', year: year(2026), grossAnnual: new Money(100_000_00, 'USD') });
 */
export const usTexas: Region = {
  id: 'us-tx',
  label: 'US — Texas',
  currency: 'USD',
  pipeline: (year) => [
    us401kPretax,
    usFederalIncomeTax(year),
    usFICA(year),
    usFederalStudentLoan(year),
  ],
};
