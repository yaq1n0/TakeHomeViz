import { Money } from './money.js';
import type { Breakdown, Deduction, DeductionResult, Region, Scenario } from './types.js';

/**
 * Run a pipeline of deductions against a scenario and produce a Breakdown.
 *
 * Each deduction sees the taxableBase left by the previous one, plus the full
 * list of results-so-far (for deductions that want to reference prior
 * calculations — e.g. US student-loan IBR needing discretionary income).
 *
 * The net is always `gross − sum(deductions.amount)`. Spendable subtracts
 * annualized fixed costs if provided.
 */
export function runPipeline(scenario: Scenario, region: Region): Breakdown {
  if (scenario.regionId !== region.id) {
    throw new Error(
      `runPipeline: scenario.regionId=${scenario.regionId} does not match region.id=${region.id}`,
    );
  }
  if (scenario.grossAnnual.currency !== region.currency) {
    throw new Error(
      `runPipeline: scenario currency ${scenario.grossAnnual.currency} does not match region currency ${region.currency}`,
    );
  }

  const gross = scenario.grossAnnual;
  const deductions: DeductionResult[] = [];
  let taxableBase = gross;

  for (const step of region.pipeline(scenario.year)) {
    const result = step(taxableBase, scenario, deductions);
    deductions.push(result);
    taxableBase = result.taxableBaseAfter;
  }

  let net = gross;
  for (const d of deductions) net = net.sub(d.amount);

  const annualFixedCosts = scenario.fixedCostsMonthly
    ? scenario.fixedCostsMonthly.mul(12)
    : Money.zero(gross.currency);
  const spendable = net.sub(annualFixedCosts);

  const marginalRate = estimateMarginalRate(scenario, region);

  return { scenario, gross, deductions, net, spendable, marginalRate };
}

/**
 * Estimate the effective marginal rate by running the pipeline at gross+£1/$1
 * and comparing nets. This is simpler and more robust than trying to sum rates
 * across schedules when deductions interact in non-trivial ways (PA taper,
 * student-loan thresholds, etc.).
 */
function estimateMarginalRate(scenario: Scenario, region: Region): number {
  const epsilon = new Money(100_00, scenario.grossAnnual.currency); // £100/$100 bump
  const bumped: Scenario = {
    ...scenario,
    grossAnnual: scenario.grossAnnual.add(epsilon),
  };
  const baseNet = computeNet(scenario, region).amount;
  const bumpedNet = computeNet(bumped, region).amount;
  const netDelta = bumpedNet - baseNet;
  const grossDelta = epsilon.amount;
  if (grossDelta === 0) return 0;
  return 1 - netDelta / grossDelta;
}

function computeNet(scenario: Scenario, region: Region): Money {
  const gross = scenario.grossAnnual;
  const deductions: DeductionResult[] = [];
  let taxableBase = gross;
  for (const step of region.pipeline(scenario.year)) {
    const result = step(taxableBase, scenario, deductions);
    deductions.push(result);
    taxableBase = result.taxableBaseAfter;
  }
  let net = gross;
  for (const d of deductions) net = net.sub(d.amount);
  return net;
}

/**
 * Compose a `Deduction` that takes an already-computed amount and reduces the
 * taxableBase by it. Useful for simple pre-tax reductions like pension.
 */
export function reducingDeduction(name: string, amount: Money): Deduction {
  return (taxableBase) => ({
    name,
    amount,
    taxableBaseAfter: taxableBase.sub(amount),
  });
}

/**
 * Compose a `Deduction` that takes an already-computed amount but does NOT
 * reduce the taxableBase (e.g. NI runs against the pension-reduced base, but
 * NI itself is not pre-tax for income tax — though in practice the UK pipeline
 * orders income tax before NI so this doesn't bite).
 */
export function nonReducingDeduction(name: string, amount: Money): Deduction {
  return (taxableBase) => ({
    name,
    amount,
    taxableBaseAfter: taxableBase,
  });
}
