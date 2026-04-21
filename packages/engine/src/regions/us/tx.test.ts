import { describe, expect, it } from 'vitest';
import { Money } from '../../money.js';
import { runPipeline } from '../../pipeline.js';
import { year } from '../../year.js';
import { usTexas } from './tx.js';

function byName(deductions: ReadonlyArray<{ name: string; amount: Money }>, name: string): Money {
  const hit = deductions.find((d) => d.name === name);
  if (!hit) throw new Error(`deduction ${name} not found`);
  return hit.amount;
}

describe('usTexas — $100,000 gross, 0% 401(k) (federal-only pipeline)', () => {
  /*
   *  gross                     = 100,000.00
   *  no state income tax, no state SDI
   *
   *  Federal IT on taxable = 85,000
   *     10% × 11,925         =   1,192.50
   *     12% × 36,550         =   4,386.00
   *     22% × 36,525         =   8,035.50
   *    total                 =  13,614.00
   *
   *  FICA on 100,000:
   *     SS 6.2% × 100,000    =   6,200.00
   *     Med 1.45% × 100,000  =   1,450.00
   *     Add'l Medicare       =       0.00
   *    total                 =   7,650.00
   *
   *  sum deductions          =  21,264.00
   *  net                     =  78,736.00
   */
  const scenario = {
    regionId: 'us-tx' as const,
    year: year(2026),
    grossAnnual: new Money(100_000_00, 'USD'),
  };
  const b = runPipeline(scenario, usTexas);

  it('no state income tax deduction is present', () => {
    expect(b.deductions.find((d) => d.name.includes('state-income-tax'))).toBeUndefined();
  });
  it('federal income tax = 13,614.00', () => {
    expect(byName(b.deductions, 'federal-income-tax').amount).toBe(13_614_00);
  });
  it('FICA = 7,650.00', () => {
    expect(byName(b.deductions, 'fica').amount).toBe(7_650_00);
  });
  it('net = 78,736.00', () => {
    expect(b.net.amount).toBe(78_736_00);
  });
});
