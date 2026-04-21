import { describe, expect, it } from 'vitest';
import { calculate } from '../calculate.js';
import { ukEngFixtures } from './uk-eng-2026-27.fixtures.js';
import { usCaFixtures } from './us-ca-2026.fixtures.js';
import { usNyFixtures } from './us-ny-2026.fixtures.js';
import { usFederalFixtures } from './us-federal-2026.fixtures.js';
import type { Fixture } from './types.js';

function runFixtureSuite(label: string, fixtures: Fixture[]): void {
  describe(label, () => {
    for (const fx of fixtures) {
      describe(fx.name, () => {
        const b = calculate(fx.scenario);

        if (fx.expected.deductions) {
          for (const [name, expected] of Object.entries(fx.expected.deductions)) {
            it(`deduction "${name}" = ${expected}`, () => {
              const hit = b.deductions.find((d) => d.name === name);
              expect(hit, `missing deduction: ${name}`).toBeDefined();
              expect(hit?.amount.amount).toBe(expected);
            });
          }
        }

        if (fx.expected.net !== undefined) {
          it(`net = ${fx.expected.net}`, () => {
            expect(b.net.amount).toBe(fx.expected.net);
          });
        }
      });
    }
  });
}

runFixtureSuite('uk-eng 2026-27 reference scenarios', ukEngFixtures);
runFixtureSuite('us-ca 2026 reference scenarios', usCaFixtures);
runFixtureSuite('us-ny 2026 reference scenarios', usNyFixtures);
runFixtureSuite('us-federal 2026 reference scenarios (tx + wa)', usFederalFixtures);
