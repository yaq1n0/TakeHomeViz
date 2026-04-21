import type { Region } from '../../types.js';
import { us401kPretax } from './federal/deductions/401k.js';
import { usFederalIncomeTax } from './federal/deductions/income-tax.js';
import { usFICA } from './federal/deductions/fica.js';
import { usFederalStudentLoan } from './federal/deductions/student-loan.js';

/**
 * US — Washington region pipeline.
 *
 * Washington has **no state income tax**, so the pipeline is federal-only:
 *   1. 401(k) pre-tax
 *   2. Federal income tax
 *   3. FICA (on gross)
 *   4. Federal student loan — v1.1 stub
 *
 * Note: WA Paid Family & Medical Leave (PFML) and WA Cares (long-term care)
 * payroll taxes are small and NOT currently modeled (flagged for v1.1).
 * TODO(yaqin): verify — consider adding WA PFML (~0.4% split employer/employee)
 * and WA Cares (0.58% employee) once Scenario gains the relevant toggles.
 *
 * @example
 *   calculate({ regionId: 'us-wa', year: year(2026), grossAnnual: new Money(200_000_00, 'USD') });
 */
export const usWashington: Region = {
  id: 'us-wa',
  label: 'US — Washington',
  currency: 'USD',
  pipeline: (year) => [
    us401kPretax,
    usFederalIncomeTax(year),
    usFICA(year),
    usFederalStudentLoan(year),
  ],
};
