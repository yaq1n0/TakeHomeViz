import { describe, expect, it } from 'vitest';
import { Money } from '../../money.js';
import { runPipeline } from '../../pipeline.js';
import { year } from '../../year.js';
import { usWashington } from './wa.js';

function byName(deductions: ReadonlyArray<{ name: string; amount: Money }>, name: string): Money {
  const hit = deductions.find((d) => d.name === name);
  if (!hit) throw new Error(`deduction ${name} not found`);
  return hit.amount;
}

describe('usWashington — $200,000 gross, 0% 401(k) (federal-only pipeline)', () => {
  /*
   *  gross                     = 200,000.00
   *  no state income tax, no state SDI
   *
   *  Federal IT on taxable = 185,000
   *     10% × 11,925         =   1,192.50
   *     12% × 36,550         =   4,386.00
   *     22% × 54,875         =  12,072.50
   *     24% × 81,650         =  19,596.00   (185,000 − 103,350)
   *    total                 =  37,247.00
   *
   *  FICA on 200,000:
   *     SS 6.2% × 174,900    =  10,843.80   (capped)
   *     Med 1.45% × 200,000  =   2,900.00
   *     Add'l Medicare       =       0.00   (threshold = 200k, not > 200k)
   *    total                 =  13,743.80
   *
   *  sum deductions          =  50,990.80
   *  net                     = 149,009.20
   */
  const scenario = {
    regionId: 'us-wa' as const,
    year: year(2026),
    grossAnnual: new Money(200_000_00, 'USD'),
  };
  const b = runPipeline(scenario, usWashington);

  it('no state income tax deduction is present', () => {
    expect(b.deductions.find((d) => d.name.includes('state-income-tax'))).toBeUndefined();
  });
  it('federal income tax = 37,247.00', () => {
    expect(byName(b.deductions, 'federal-income-tax').amount).toBe(37_247_00);
  });
  it("FICA = 13,743.80 (SS capped exactly at wage base, no Add'l Medicare)", () => {
    expect(byName(b.deductions, 'fica').amount).toBe(13_743_80);
  });
  it('net = 149,009.20', () => {
    expect(b.net.amount).toBe(149_009_20);
  });
});
