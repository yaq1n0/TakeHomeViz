import { describe, expect, it } from 'vitest';
import { Money } from '../../money.js';
import { runPipeline } from '../../pipeline.js';
import { year } from '../../year.js';
import { usCalifornia } from './ca.js';

/**
 * Pull out named deductions from the breakdown for easier assertions.
 */
function byName(deductions: ReadonlyArray<{ name: string; amount: Money }>, name: string): Money {
  const hit = deductions.find((d) => d.name === name);
  if (!hit) throw new Error(`deduction ${name} not found`);
  return hit.amount;
}

describe('usCalifornia — $100,000 gross, 5% 401(k)', () => {
  /*
   * Reference arithmetic (USD, single filer, 2026 projected bands):
   *
   *  gross                    = 100,000.00
   *  401(k) 5%                =   5,000.00   (under 23,500 cap)
   *  post-401k base           =  95,000.00
   *
   *  Federal IT:
   *    taxable = 95,000 − 15,000 = 80,000
   *     10% × 11,925          =   1,192.50
   *     12% × 36,550          =   4,386.00
   *     22% × 31,525          =   6,935.50
   *    total                  =  12,514.00
   *
   *  CA IT:
   *    taxable = 95,000 − 5,500 = 89,500
   *     1% × 10,756           =     107.56
   *     2% × 14,743           =     294.86
   *     4% × 14,746           =     589.84
   *     6% × 15,621           =     937.26
   *     8% × 14,740           =   1,179.20
   *     9.3% × 18,894         =   1,757.14  (pre-round 1,757.142)
   *    total                  =   4,865.86
   *
   *  FICA (on GROSS 100,000 — 401(k) does NOT reduce base):
   *     SS 6.2% × 100,000     =   6,200.00   (under $174,900 cap)
   *     Medicare 1.45% × 100k =   1,450.00
   *     Add'l Medicare        =       0.00   (gross < 200k)
   *    total                  =   7,650.00
   *
   *  CA SDI  1.1% × 100,000   =   1,100.00
   *  Federal student loan     =       0.00   (v1.1 stub)
   *
   *  sum deductions           =  31,129.86
   *  net                      =  68,870.14
   */
  const scenario = {
    regionId: 'us-ca' as const,
    year: year(2026),
    grossAnnual: new Money(100_000_00, 'USD'),
    pensionPct: 5,
  };
  const b = runPipeline(scenario, usCalifornia);

  it('401(k) contribution is 5,000', () => {
    expect(byName(b.deductions, '401k-pretax').amount).toBe(5_000_00);
  });
  it('federal income tax = 12,514.00', () => {
    expect(byName(b.deductions, 'federal-income-tax').amount).toBe(12_514_00);
  });
  it('CA state income tax = 4,865.86', () => {
    expect(byName(b.deductions, 'ca-state-income-tax').amount).toBe(4_865_86);
  });
  it('FICA = 7,650.00 (computed on gross, not post-401k)', () => {
    expect(byName(b.deductions, 'fica').amount).toBe(7_650_00);
  });
  it('CA SDI = 1,100.00', () => {
    expect(byName(b.deductions, 'ca-sdi').amount).toBe(1_100_00);
  });
  it('federal student loan = 0 (v1.1 stub)', () => {
    expect(byName(b.deductions, 'federal-student-loan').amount).toBe(0);
  });
  it('net = 68,870.14', () => {
    expect(b.net.amount).toBe(68_870_14);
  });
});

describe('usCalifornia — $350,000 gross, 10% 401(k)', () => {
  /*
   * gross                     = 350,000.00
   * 401(k) 10% capped         =  23,500.00  (min(35k, 23.5k cap))
   * post-401k base            = 326,500.00
   *
   * Federal IT:
   *    taxable = 326,500 − 15,000 = 311,500
   *     10% × 11,925          =   1,192.50
   *     12% × 36,550          =   4,386.00
   *     22% × 54,875          =  12,072.50
   *     24% × 93,950          =  22,548.00
   *     32% × 53,225          =  17,032.00
   *     35% × 60,975          =  21,341.25
   *    total                  =  78,572.25
   *
   * CA IT:
   *    taxable = 326,500 − 5,500 = 321,000
   *     1%  × 10,756          =     107.56
   *     2%  × 14,743          =     294.86
   *     4%  × 14,746          =     589.84
   *     6%  × 15,621          =     937.26
   *     8%  × 14,740          =   1,179.20
   *     9.3% × 250,394        =  23,286.64  (pre-round 23,286.642)
   *    total                  =  26,395.36
   *
   * FICA on 350,000:
   *     SS cap 6.2% × 174,900 =  10,843.80
   *     Med 1.45% × 350,000   =   5,075.00
   *     Add'l 0.9% × 150,000  =   1,350.00
   *    total                  =  17,268.80
   *
   * CA SDI 1.1% × 350,000     =   3,850.00
   * Fed SL                    =       0.00
   *
   * sum deductions            = 149,586.41
   * net                       = 200,413.59
   */
  const scenario = {
    regionId: 'us-ca' as const,
    year: year(2026),
    grossAnnual: new Money(350_000_00, 'USD'),
    pensionPct: 10,
  };
  const b = runPipeline(scenario, usCalifornia);

  it('401(k) capped at 23,500', () => {
    expect(byName(b.deductions, '401k-pretax').amount).toBe(23_500_00);
  });
  it('federal income tax = 78,572.25', () => {
    expect(byName(b.deductions, 'federal-income-tax').amount).toBe(78_572_25);
  });
  it('CA state income tax = 26,395.36', () => {
    expect(byName(b.deductions, 'ca-state-income-tax').amount).toBe(26_395_36);
  });
  it("FICA = 17,268.80 (SS capped, Add'l Medicare kicks in)", () => {
    expect(byName(b.deductions, 'fica').amount).toBe(17_268_80);
  });
  it('CA SDI = 3,850.00 (no wage cap from 2024)', () => {
    expect(byName(b.deductions, 'ca-sdi').amount).toBe(3_850_00);
  });
  it('net = 200,413.59', () => {
    expect(b.net.amount).toBe(200_413_59);
  });
});

describe('usCalifornia — Mental Health Services Tax above $1M', () => {
  /*
   * At a base of $1,500,000 (post-401k) → CA taxable = 1,494,500.
   * CA bands above $721,314 are 12.3%. Base tax through all bands:
   *
   * bands running cumulative amounts at edge, then 12.3% × (1,494,500 − 721,314)
   * MHST = 1% × (1,494,500 − 1,000,000) = 4,945.00
   *
   * We don't pin the full CA number here (brackets churn yearly) — we instead
   * assert that MHST raises the CA tax by exactly 4,945 relative to the same
   * taxable base without MHST. Property: MHST adds (excess × 0.01) atop the
   * base schedule.
   */
  const mhstScenario = {
    regionId: 'us-ca' as const,
    year: year(2026),
    grossAnnual: new Money(1_500_000_00, 'USD'),
    pensionPct: 0,
  };
  const belowMhst = {
    ...mhstScenario,
    grossAnnual: new Money(1_000_000_00, 'USD'),
  };

  it('MHST triggers above $1M: delta CA tax includes the 1% surcharge', () => {
    const b = runPipeline(mhstScenario, usCalifornia);
    const caTax = byName(b.deductions, 'ca-state-income-tax').amount;
    // At a taxable income of 1,494,500 (= 1,500,000 − 5,500):
    //   MHST excess over 1,000,000 = 494,500 → adds 4,945.00.
    // We check the CA tax exceeds the MHST surcharge amount as a floor.
    expect(caTax).toBeGreaterThan(4_945_00);
    // And check below-threshold case has no MHST portion. At gross 1,000,000,
    // taxable = 994,500, which is below the $1M MHST threshold.
    const bBelow = runPipeline(belowMhst, usCalifornia);
    const caTaxBelow = byName(bBelow.deductions, 'ca-state-income-tax').amount;
    // Going from $1M gross to $1.5M gross adds $500,000 of taxable income,
    // $494,500 of which is above the $1M MHST line → +$4,945 surcharge on top
    // of the normal 12.3% band tax.
    const delta = caTax - caTaxBelow;
    // Expected delta: 12.3% × 500,000 (band) + 4,945 (MHST) = 61,500 + 4,945 = 66,445.
    expect(delta).toBe(66_445_00);
  });
});

describe('usCalifornia — 401(k) does NOT reduce FICA base', () => {
  it('FICA on 200k with 10% 401(k) matches FICA on 200k with 0% 401(k)', () => {
    const base = {
      regionId: 'us-ca' as const,
      year: year(2026),
      grossAnnual: new Money(200_000_00, 'USD'),
    };
    const withPension = runPipeline({ ...base, pensionPct: 10 }, usCalifornia);
    const noPension = runPipeline({ ...base, pensionPct: 0 }, usCalifornia);
    expect(byName(withPension.deductions, 'fica').amount).toBe(
      byName(noPension.deductions, 'fica').amount,
    );
  });
});

describe('usCalifornia — Social Security wage-base cap', () => {
  it('SS portion of FICA stops growing past the $174,900 cap', () => {
    const s1 = runPipeline(
      {
        regionId: 'us-ca',
        year: year(2026),
        grossAnnual: new Money(200_000_00, 'USD'),
      },
      usCalifornia,
    );
    const s2 = runPipeline(
      {
        regionId: 'us-ca',
        year: year(2026),
        grossAnnual: new Money(500_000_00, 'USD'),
      },
      usCalifornia,
    );
    // SS component is in meta of the fica deduction.
    const ss1 = (s1.deductions.find((d) => d.name === 'fica')?.meta?.['socialSecurity'] ??
      0) as number;
    const ss2 = (s2.deductions.find((d) => d.name === 'fica')?.meta?.['socialSecurity'] ??
      0) as number;
    // 6.2% × 174,900 = 10,843.80 (in cents: 174,900,00 × 0.062 = 10,843,80).
    expect(ss1).toBe(10_843_80);
    expect(ss2).toBe(10_843_80);
  });
});

describe('usCalifornia — Additional Medicare above $200k single', () => {
  it('kicks in exactly at 200k, scales linearly with gross above', () => {
    const under = runPipeline(
      {
        regionId: 'us-ca',
        year: year(2026),
        grossAnnual: new Money(199_999_00, 'USD'),
      },
      usCalifornia,
    );
    const over = runPipeline(
      {
        regionId: 'us-ca',
        year: year(2026),
        grossAnnual: new Money(300_000_00, 'USD'),
      },
      usCalifornia,
    );
    const underAddMed = (under.deductions.find((d) => d.name === 'fica')?.meta?.[
      'additionalMedicare'
    ] ?? 0) as number;
    const overAddMed = (over.deductions.find((d) => d.name === 'fica')?.meta?.[
      'additionalMedicare'
    ] ?? 0) as number;
    expect(underAddMed).toBe(0);
    // 0.9% × (300,000 − 200,000) = 900.00 → 90,000 cents.
    expect(overAddMed).toBe(900_00);
  });
});
