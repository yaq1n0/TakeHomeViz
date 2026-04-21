import { Money } from '../money.js';
import { year } from '../year.js';
import type { Fixture } from './types.js';

const Y = year(2026);
const IRS_PUB_15T = 'https://www.irs.gov/pub/irs-pdf/p15t.pdf';
const SSA_WAGE_BASE = 'https://www.ssa.gov/OACT/COLA/cbb.html';

/**
 * Federal-only fixtures — asserted against federal-only pipelines (Texas and
 * Washington) since they have no state income tax or state SDI. Exercising
 * both ensures any federal-layer regression shows up even when a state layer
 * happens to cancel it out.
 */
export const usFederalFixtures: Fixture[] = [
  {
    name: 'us-tx — $100,000 gross, 0% 401(k)',
    source: `${IRS_PUB_15T} (derived — federal-only pipeline)`,
    scenario: {
      regionId: 'us-tx',
      year: Y,
      grossAnnual: new Money(100_000_00, 'USD'),
    },
    /*
     * Federal IT on 85,000 = 13,614.00
     * FICA: 6,200 + 1,450 = 7,650.00
     * Net: 78,736.00
     */
    expected: {
      deductions: {
        'federal-income-tax': 13_614_00,
        fica: 7_650_00,
      },
      net: 78_736_00,
    },
  },
  {
    name: 'us-wa — $200,000 gross (SS capped exactly at wage base)',
    source: `${IRS_PUB_15T} + ${SSA_WAGE_BASE}`,
    scenario: {
      regionId: 'us-wa',
      year: Y,
      grossAnnual: new Money(200_000_00, 'USD'),
    },
    /*
     * Federal IT on 185,000 = 37,247.00
     * FICA: 10,843.80 (SS cap) + 2,900 Medicare + 0 Add'l = 13,743.80
     * Net: 149,009.20
     */
    expected: {
      deductions: {
        'federal-income-tax': 37_247_00,
        fica: 13_743_80,
      },
      net: 149_009_20,
    },
  },
];
