/**
 * Snapshot tests for the README "launch examples" trio. PLAN §8.4 calls these
 * out explicitly: the $350k SF / £150k London / £80k Manchester scenarios
 * should never silently shift. If a band rate or pipeline order changes, the
 * inline snapshot below will break and force the change to be reviewed.
 *
 * Snapshots deliberately include only stable fields — scenario shape,
 * gross/net/spendable amounts in minor units, per-deduction name + amount,
 * and marginalRate rounded to 4 dp.
 */

import { describe, expect, it } from 'vitest';
import { calculate } from './calculate.js';
import { Money } from './money.js';
import { year } from './year.js';
import type { Breakdown, Scenario } from './types.js';

interface StableBreakdown {
  regionId: string;
  year: number;
  gross: number;
  net: number;
  spendable: number;
  marginalRate: number;
  deductions: Array<{ name: string; amount: number }>;
}

function stable(b: Breakdown): StableBreakdown {
  return {
    regionId: b.scenario.regionId,
    year: b.scenario.year,
    gross: b.gross.amount,
    net: b.net.amount,
    spendable: b.spendable.amount,
    marginalRate: Math.round(b.marginalRate * 10_000) / 10_000,
    deductions: b.deductions.map((d) => ({ name: d.name, amount: d.amount.amount })),
  };
}

const sfScenario: Scenario = {
  regionId: 'us-ca',
  year: year(2026),
  grossAnnual: new Money(350_000_00, 'USD'),
  pensionPct: 10,
  fixedCostsMonthly: new Money(6_000_00, 'USD'),
};

const londonScenario: Scenario = {
  regionId: 'uk-eng',
  year: year(2026),
  grossAnnual: new Money(150_000_00, 'GBP'),
  pensionPct: 8,
  studentLoan: { plan: 'uk-plan-2' },
  fixedCostsMonthly: new Money(3_500_00, 'GBP'),
};

const manchesterScenario: Scenario = {
  regionId: 'uk-eng',
  year: year(2026),
  grossAnnual: new Money(80_000_00, 'GBP'),
  pensionPct: 5,
  studentLoan: { plan: 'uk-plan-2' },
  fixedCostsMonthly: new Money(1_800_00, 'GBP'),
};

describe('launch-example snapshots', () => {
  it('$350k SF (us-ca, 10% 401k, $6k/mo fixed)', () => {
    expect(stable(calculate(sfScenario))).toMatchInlineSnapshot(`
      {
        "deductions": [
          {
            "amount": 2350000,
            "name": "401k-pretax",
          },
          {
            "amount": 7857225,
            "name": "federal-income-tax",
          },
          {
            "amount": 2639536,
            "name": "ca-state-income-tax",
          },
          {
            "amount": 1726880,
            "name": "fica",
          },
          {
            "amount": 385000,
            "name": "ca-sdi",
          },
          {
            "amount": 0,
            "name": "federal-student-loan",
          },
        ],
        "gross": 35000000,
        "marginalRate": 0.4775,
        "net": 20041359,
        "regionId": "us-ca",
        "spendable": 12841359,
        "year": 2026,
      }
    `);
  });

  it('£150k London (uk-eng, 8% salary sacrifice, plan 2 loan, £3.5k/mo fixed)', () => {
    expect(stable(calculate(londonScenario))).toMatchInlineSnapshot(`
      {
        "deductions": [
          {
            "amount": 1200000,
            "name": "salary-sacrifice-pension",
          },
          {
            "amount": 4578900,
            "name": "income-tax",
          },
          {
            "amount": 477060,
            "name": "ni-class-1",
          },
          {
            "amount": 1093770,
            "name": "student-loan-uk-plan-2",
          },
        ],
        "gross": 15000000,
        "marginalRate": 0.6024,
        "net": 7650270,
        "regionId": "uk-eng",
        "spendable": 3450270,
        "year": 2026,
      }
    `);
  });

  it('£80k Manchester (uk-eng, 5% salary sacrifice, plan 2 loan, £1.8k/mo fixed)', () => {
    expect(stable(calculate(manchesterScenario))).toMatchInlineSnapshot(`
      {
        "deductions": [
          {
            "amount": 400000,
            "name": "salary-sacrifice-pension",
          },
          {
            "amount": 1783200,
            "name": "income-tax",
          },
          {
            "amount": 353060,
            "name": "ni-class-1",
          },
          {
            "amount": 463770,
            "name": "student-loan-uk-plan-2",
          },
        ],
        "gross": 8000000,
        "marginalRate": 0.539,
        "net": 4999970,
        "regionId": "uk-eng",
        "spendable": 2839970,
        "year": 2026,
      }
    `);
  });
});
