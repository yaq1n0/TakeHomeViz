import { describe, expect, it } from 'vitest';
import { Money } from '../../money.js';
import { runPipeline } from '../../pipeline.js';
import { year } from '../../year.js';
import { usNewYork } from './ny.js';

function byName(deductions: ReadonlyArray<{ name: string; amount: Money }>, name: string): Money {
  const hit = deductions.find((d) => d.name === name);
  if (!hit) throw new Error(`deduction ${name} not found`);
  return hit.amount;
}

describe('usNewYork — $150,000 gross, 0% 401(k)', () => {
  /*
   *  gross                     = 150,000.00
   *  401(k)                    =       0.00
   *  post-401k base            = 150,000.00
   *
   *  Federal IT:
   *    taxable = 150,000 − 15,000 = 135,000
   *     10% × 11,925          =  1,192.50
   *     12% × 36,550          =  4,386.00
   *     22% × 54,875          = 12,072.50
   *     24% × 31,650          =  7,596.00   (135,000 − 103,350)
   *    total                  = 25,247.00
   *
   *  NY IT:
   *    taxable = 150,000 − 8,000 = 142,000
   *     4%   × 8,500          =    340.00
   *     4.5% × 3,200          =    144.00
   *     5.25%× 2,200          =    115.50
   *     5.5% × 66,750         =  3,671.25   (80,650 − 13,900)
   *     6%   × 61,350         =  3,681.00   (142,000 − 80,650)
   *    total                  =  7,951.75
   *
   *  FICA on 150,000:
   *     SS 6.2% × 150,000     =  9,300.00   (under cap)
   *     Medicare 1.45% × 150k =  2,175.00
   *     Add'l Medicare        =      0.00
   *    total                  = 11,475.00
   *
   *  NY SDI flat cap          =     31.20
   *  Federal student loan     =      0.00
   *
   *  sum deductions           = 44,704.95
   *  net                      = 105,295.05
   */
  const scenario = {
    regionId: 'us-ny' as const,
    year: year(2026),
    grossAnnual: new Money(150_000_00, 'USD'),
  };
  const b = runPipeline(scenario, usNewYork);

  it('federal income tax = 25,247.00', () => {
    expect(byName(b.deductions, 'federal-income-tax').amount).toBe(25_247_00);
  });
  it('NY state income tax = 7,951.75', () => {
    expect(byName(b.deductions, 'ny-state-income-tax').amount).toBe(7_951_75);
  });
  it('FICA = 11,475.00', () => {
    expect(byName(b.deductions, 'fica').amount).toBe(11_475_00);
  });
  it('NY SDI = 31.20 (flat annual cap)', () => {
    expect(byName(b.deductions, 'ny-sdi').amount).toBe(31_20);
  });
  it('net = 105,295.05', () => {
    expect(b.net.amount).toBe(105_295_05);
  });
});

describe('usNewYork — $500,000 gross, 0% 401(k)', () => {
  /*
   *  Federal IT on taxable = 485,000
   *     10% × 11,925          =   1,192.50
   *     12% × 36,550          =   4,386.00
   *     22% × 54,875          =  12,072.50
   *     24% × 93,950          =  22,548.00
   *     32% × 53,225          =  17,032.00
   *     35% × 234,475         =  82,066.25
   *    total                  = 139,297.25
   *
   *  NY IT on taxable = 492,000
   *     4%   × 8,500          =    340.00
   *     4.5% × 3,200          =    144.00
   *     5.25%× 2,200          =    115.50
   *     5.5% × 66,750         =  3,671.25
   *     6%   × 134,750        =  8,085.00   (215,400 − 80,650)
   *     6.85%× 276,600        = 18,947.10   (492,000 − 215,400)
   *    total                  = 31,302.85
   *
   *  FICA on 500,000:
   *     SS cap 6.2% × 174,900 =  10,843.80
   *     Med 1.45% × 500,000   =   7,250.00
   *     Add'l 0.9% × 300,000  =   2,700.00
   *    total                  =  20,793.80
   *
   *  NY SDI                   =      31.20
   *  sum deductions           = 191,425.10
   *  net                      = 308,574.90
   */
  const scenario = {
    regionId: 'us-ny' as const,
    year: year(2026),
    grossAnnual: new Money(500_000_00, 'USD'),
  };
  const b = runPipeline(scenario, usNewYork);

  it('federal income tax = 139,297.25', () => {
    expect(byName(b.deductions, 'federal-income-tax').amount).toBe(139_297_25);
  });
  it('NY state income tax = 31,302.85', () => {
    expect(byName(b.deductions, 'ny-state-income-tax').amount).toBe(31_302_85);
  });
  it("FICA = 20,793.80 (SS capped; Add'l Medicare active)", () => {
    expect(byName(b.deductions, 'fica').amount).toBe(20_793_80);
  });
  it('net = 308,574.90', () => {
    expect(b.net.amount).toBe(308_574_90);
  });
});
