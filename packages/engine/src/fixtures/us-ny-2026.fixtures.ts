import { Money } from '../money.js';
import { year } from '../year.js';
import type { Fixture } from './types.js';

const Y = year(2026);
const IRS_PUB_15T = 'https://www.irs.gov/pub/irs-pdf/p15t.pdf';
const NY_IT_201 = 'https://www.tax.ny.gov/forms/current-forms/it/it201i.htm';

export const usNyFixtures: Fixture[] = [
  {
    name: '$150,000 gross, 0% 401(k)',
    source: `${IRS_PUB_15T} + ${NY_IT_201} (derived)`,
    scenario: {
      regionId: 'us-ny',
      year: Y,
      grossAnnual: new Money(150_000_00, 'USD'),
    },
    /*
     * Federal IT on 135,000 = 25,247.00
     * NY IT on 142,000 = 7,951.75
     * FICA on 150,000 = 11,475.00
     * NY SDI flat cap = 31.20
     * Net: 105,295.05
     */
    expected: {
      deductions: {
        'federal-income-tax': 25_247_00,
        'ny-state-income-tax': 7_951_75,
        fica: 11_475_00,
        'ny-sdi': 31_20,
      },
      net: 105_295_05,
    },
  },
  {
    name: '$500,000 gross, 0% 401(k) (SS capped, Add’l Medicare active)',
    source: `${IRS_PUB_15T} + ${NY_IT_201}`,
    scenario: {
      regionId: 'us-ny',
      year: Y,
      grossAnnual: new Money(500_000_00, 'USD'),
    },
    /*
     * Federal IT on 485,000 = 139,297.25
     * NY IT on 492,000 = 31,302.85
     * FICA: 10,843.80 + 7,250 + 2,700 = 20,793.80
     * NY SDI = 31.20
     * Net: 308,574.90
     */
    expected: {
      deductions: {
        'federal-income-tax': 139_297_25,
        'ny-state-income-tax': 31_302_85,
        fica: 20_793_80,
      },
      net: 308_574_90,
    },
  },
];
