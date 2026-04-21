import { Money } from '../money.js';
import { year } from '../year.js';
import type { Fixture } from './types.js';

const Y = year(2026);
const IRS_PUB_15T = 'https://www.irs.gov/pub/irs-pdf/p15t.pdf';
const FTB_TAX_RATE_SCHEDULES = 'https://www.ftb.ca.gov/forms/2024/2024-540-tax-rate-schedules.pdf';
const SSA_WAGE_BASE = 'https://www.ssa.gov/OACT/COLA/cbb.html';

export const usCaFixtures: Fixture[] = [
  {
    name: '$100,000 gross, 5% 401(k)',
    source: `${IRS_PUB_15T} + ${FTB_TAX_RATE_SCHEDULES} (derived)`,
    scenario: {
      regionId: 'us-ca',
      year: Y,
      grossAnnual: new Money(100_000_00, 'USD'),
      pensionPct: 5,
    },
    /*
     * 401(k) 5% = 5,000; post-401k base = 95,000; federal taxable = 80,000
     * Federal IT: 1,192.50 + 4,386 + 6,935.50 = 12,514.00
     * CA taxable = 89,500 → 4,865.86 (see ca.test.ts comments for band-by-band)
     * FICA on GROSS 100,000 (401k doesn't reduce FICA base): SS 6,200 + Med 1,450 = 7,650
     * CA SDI 1.1% × 100,000 = 1,100
     * Net: 100,000 − 5,000 − 12,514 − 4,865.86 − 7,650 − 1,100 = 68,870.14
     */
    expected: {
      deductions: {
        '401k-pretax': 5_000_00,
        'federal-income-tax': 12_514_00,
        'ca-state-income-tax': 4_865_86,
        fica: 7_650_00,
        'ca-sdi': 1_100_00,
        'federal-student-loan': 0,
      },
      net: 68_870_14,
    },
  },
  {
    name: '$350,000 gross, 10% 401(k) (SS cap + Add’l Medicare active)',
    source: `${IRS_PUB_15T} + ${FTB_TAX_RATE_SCHEDULES} + ${SSA_WAGE_BASE}`,
    scenario: {
      regionId: 'us-ca',
      year: Y,
      grossAnnual: new Money(350_000_00, 'USD'),
      pensionPct: 10,
    },
    /*
     * 401(k) capped at 23,500; post-401k base = 326,500
     * Federal IT on 311,500 → 78,572.25
     * CA IT on 321,000 → 26,395.36
     * FICA: 10,843.80 + 5,075 + 1,350 = 17,268.80
     * CA SDI 1.1% × 350,000 = 3,850
     * Net: 200,413.59
     */
    expected: {
      deductions: {
        '401k-pretax': 23_500_00,
        'federal-income-tax': 78_572_25,
        'ca-state-income-tax': 26_395_36,
        fica: 17_268_80,
        'ca-sdi': 3_850_00,
      },
      net: 200_413_59,
    },
  },
];
