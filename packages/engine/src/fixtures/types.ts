import type { Scenario } from '../types.js';

/**
 * A reference scenario with expected numeric results. `source` should point to
 * an official worked example (HMRC, IRS Pub 15-T, FTB, etc.) whenever one
 * exists. When the authority publishes bands but not a worked example at our
 * chosen gross, mark `source: 'derived'` and inline the arithmetic in a
 * comment — reviewers can still check the math against the band schedule.
 *
 * `expected.deductions` maps deduction name → amount in minor units. `net` is
 * also in minor units. Only the fields you pin are asserted; `Partial` lets
 * region-only scenarios skip irrelevant deductions.
 */
export interface FixtureExpected {
  net?: number;
  deductions?: Record<string, number>;
}

export interface Fixture {
  name: string;
  source: string;
  scenario: Scenario;
  expected: FixtureExpected;
}
