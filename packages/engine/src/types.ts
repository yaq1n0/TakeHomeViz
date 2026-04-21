import type { Money } from './money.js';
import type { Year } from './year.js';

// Scotland ('uk-sct') will be re-added when its pipeline lands — see PLAN.md §3 / §7 Phase 4.
export type RegionId = 'uk-eng' | 'us-ca' | 'us-ny' | 'us-wa' | 'us-tx';

export type StudentLoanPlanId =
  | 'uk-plan-1'
  | 'uk-plan-2'
  | 'uk-plan-4'
  | 'uk-plan-5'
  | 'uk-postgrad'
  | 'us-federal-ibr'; // v1.1 placeholder — treated as no-op for now, see pipeline notes

export interface StudentLoanPlan {
  plan: StudentLoanPlanId;
}

export interface Scenario {
  regionId: RegionId;
  year: Year;
  grossAnnual: Money;
  pensionPct?: number; // 0..100, pre-tax, UK salary-sacrifice or US 401(k) pre-tax
  studentLoan?: StudentLoanPlan;
  fixedCostsMonthly?: Money;
}

/**
 * A single deduction's output. `amount` is always positive. `taxableBaseAfter`
 * is what the *next* deduction in the pipeline should treat as the base — this
 * is how UK salary-sacrifice reduces the base for both income tax *and* NI, or
 * how 401(k) reduces the base for federal/state but not FICA.
 */
export interface DeductionResult {
  name: string;
  amount: Money;
  taxableBaseAfter: Money;
  meta?: Record<string, unknown>;
}

export interface Breakdown {
  scenario: Scenario;
  gross: Money;
  deductions: DeductionResult[];
  net: Money;
  spendable: Money;
  marginalRate: number;
}

/**
 * A deduction is a pure function: `(taxableBase, scenario, results-so-far) => result`.
 *
 * The function decides whether it consumes the incoming taxableBase (returning
 * a reduced base) or leaves it untouched (e.g. FICA runs against gross-minus-401k
 * but doesn't change the base that income tax sees — though in practice the US
 * pipeline is ordered so this doesn't matter).
 */
export type Deduction = (
  taxableBase: Money,
  ctx: Scenario,
  pipelineSoFar: readonly DeductionResult[],
) => DeductionResult;

export interface Band {
  /** Inclusive lower bound, integer minor units. */
  from: number;
  /** Exclusive upper bound, integer minor units. `Infinity` for the top band. */
  to: number;
  rate: number; // 0..1
}

export interface BandSchedule {
  /** URL pointing to the official authority (gov.uk, irs.gov, ftb.ca.gov, etc.). */
  source: string;
  /** ISO-8601 date when these bands took effect (inclusive). */
  effectiveFrom: string;
  bands: Band[];
  /**
   * Optional post-processing modifiers. Each takes (amountDue, taxableBase) and
   * returns a new amountDue. Used for things like the UK personal-allowance
   * taper above £100k, where the thing that changes is effectively the PA
   * rather than the band rates.
   */
  modifiers?: BandModifier[];
}

export type BandModifier = (amountDue: number, taxableBase: number) => number;

/**
 * A region is a pipeline of deductions applied in legally-meaningful order,
 * plus metadata for UI display.
 */
export interface Region {
  id: RegionId;
  label: string;
  currency: 'GBP' | 'USD';
  pipeline: (year: Year) => Deduction[];
}
