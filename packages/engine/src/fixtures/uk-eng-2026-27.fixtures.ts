import { Money } from '../money.js';
import { year } from '../year.js';
import type { Fixture } from './types.js';

const Y = year(2026);
const HMRC_INCOME_TAX_RATES = 'https://www.gov.uk/income-tax-rates';
const HMRC_NI_RATES = 'https://www.gov.uk/national-insurance-rates-letters';
const HMRC_STUDENT_LOAN = 'https://www.gov.uk/repaying-your-student-loan';

export const ukEngFixtures: Fixture[] = [
  {
    name: '£30,000 gross, no pension, no student loan',
    source: `${HMRC_INCOME_TAX_RATES} (derived — straight through first two bands)`,
    scenario: {
      regionId: 'uk-eng',
      year: Y,
      grossAnnual: new Money(30_000_00, 'GBP'),
    },
    /*
     * IT: (30,000 − 12,570) × 0.20 = 3,486.00
     * NI: (30,000 − 12,570) × 0.08 = 1,394.40
     * Net: 30,000 − 3,486 − 1,394.40 = 25,119.60
     */
    expected: {
      deductions: {
        'income-tax': 3_486_00,
        'ni-class-1': 1_394_40,
      },
      net: 25_119_60,
    },
  },
  {
    name: '£60,000 gross, 5% salary sacrifice, Plan 2',
    source: `${HMRC_INCOME_TAX_RATES} + ${HMRC_STUDENT_LOAN} (derived)`,
    scenario: {
      regionId: 'uk-eng',
      year: Y,
      grossAnnual: new Money(60_000_00, 'GBP'),
      pensionPct: 5,
      studentLoan: { plan: 'uk-plan-2' },
    },
    /*
     * Pension 5% = 3,000; taxable for IT/NI = 57,000
     * IT: 7,540 + (57,000−50,270)×0.40 = 10,232
     * NI: 3,016 + (57,000−50,270)×0.02 = 3,150.60
     * SL Plan 2 on GROSS: (60,000 − 28,470) × 0.09 = 2,837.70
     * Net: 60,000 − 3,000 − 10,232 − 3,150.60 − 2,837.70 = 40,779.70
     */
    expected: {
      deductions: {
        'salary-sacrifice-pension': 3_000_00,
        'income-tax': 10_232_00,
        'ni-class-1': 3_150_60,
        'student-loan-uk-plan-2': 2_837_70,
      },
      net: 40_779_70,
    },
  },
  {
    name: '£120,000 gross, no pension (PA taper triggered)',
    source: `${HMRC_INCOME_TAX_RATES} (derived — PA taper per ITA 2007 s.35)`,
    scenario: {
      regionId: 'uk-eng',
      year: Y,
      grossAnnual: new Money(120_000_00, 'GBP'),
    },
    /*
     * PA taper: excess 20,000 → PA reduced by 10,000
     * IT base 35,432 + surcharge 10,000×0.20 = 2,000 → 37,432
     * NI: 3,016 + (120,000−50,270)×0.02 = 4,410.60
     * Net: 78,157.40
     */
    expected: {
      deductions: {
        'income-tax': 37_432_00,
        'ni-class-1': 4_410_60,
      },
      net: 78_157_40,
    },
  },
  {
    name: '£200,000 gross, 10% salary sacrifice, Plan 2 (PA fully tapered)',
    source: `${HMRC_INCOME_TAX_RATES} + ${HMRC_NI_RATES} (derived)`,
    scenario: {
      regionId: 'uk-eng',
      year: Y,
      grossAnnual: new Money(200_000_00, 'GBP'),
      pensionPct: 10,
      studentLoan: { plan: 'uk-plan-2' },
    },
    /*
     * Pension 20,000; taxable for IT/NI = 180,000; PA fully tapered
     * IT base 62,175 + 12,570×0.20 surcharge = 64,689
     * NI: 3,016 + (180,000−50,270)×0.02 = 5,610.60
     * SL Plan 2 on GROSS: (200,000 − 28,470) × 0.09 = 15,437.70
     * Net: 200,000 − 20,000 − 64,689 − 5,610.60 − 15,437.70 = 94,262.70
     */
    expected: {
      deductions: {
        'salary-sacrifice-pension': 20_000_00,
        'income-tax': 64_689_00,
        'ni-class-1': 5_610_60,
        'student-loan-uk-plan-2': 15_437_70,
      },
      net: 94_262_70,
    },
  },
  {
    name: '£10,000 gross, below all thresholds',
    source: `${HMRC_INCOME_TAX_RATES} (derived — below PA)`,
    scenario: {
      regionId: 'uk-eng',
      year: Y,
      grossAnnual: new Money(10_000_00, 'GBP'),
    },
    expected: {
      deductions: {
        'income-tax': 0,
        'ni-class-1': 0,
      },
      net: 10_000_00,
    },
  },
];
