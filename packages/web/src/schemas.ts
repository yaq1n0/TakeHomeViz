import { z } from 'zod';
import type { RegionId, StudentLoanPlanId } from '@takehomeviz/engine';

const regionIdSchema = z.enum([
  'uk-eng',
  'us-ca',
  'us-ny',
  'us-wa',
  'us-tx',
]) satisfies z.ZodType<RegionId>;

const studentLoanPlanIdSchema = z.enum([
  'uk-plan-1',
  'uk-plan-2',
  'uk-plan-4',
  'uk-plan-5',
  'uk-postgrad',
  'us-federal-ibr',
]) satisfies z.ZodType<StudentLoanPlanId>;

export const currencySchema = z.enum(['GBP', 'USD']);

export const expenseSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().max(60),
  monthlyMajor: z.number().finite().nonnegative(),
});

export type Expense = z.infer<typeof expenseSchema>;

export const locationSchema = z.object({
  countryCode: z.string().length(2),
  countryName: z.string().max(80),
  cityName: z.string().max(80),
});
export type Location = z.infer<typeof locationSchema>;

/**
 * Serialized scenario shape — numbers live as *major* units (pounds/dollars)
 * so a quick look at a shared URL is human-readable. Conversion to engine
 * integer-minor-unit `Money` happens at the boundary.
 */
export const serializedScenarioSchema = z.object({
  regionId: regionIdSchema,
  year: z.number().int().min(2000).max(2100),
  grossMajor: z.number().finite().nonnegative(),
  currency: currencySchema,
  name: z.string().max(60).optional(),
  location: locationSchema.optional(),
  pensionPct: z.number().min(0).max(100).optional(),
  loan: z
    .object({
      plan: studentLoanPlanIdSchema,
    })
    .optional(),
  expenses: z.array(expenseSchema).max(20).optional(),
});

export type SerializedScenario = z.infer<typeof serializedScenarioSchema>;

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `exp_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Permissive input shape covering both the current schema and the legacy
 * `fixedCostsMonthlyMajor` field. Old shared URLs pass through this before
 * being validated by `serializedScenarioSchema`.
 */
export function legacyDecodeAndMigrate(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const r = raw as Record<string, unknown>;
  if (!('fixedCostsMonthlyMajor' in r)) return r;
  const { fixedCostsMonthlyMajor, ...rest } = r;
  const amount =
    typeof fixedCostsMonthlyMajor === 'number' && Number.isFinite(fixedCostsMonthlyMajor)
      ? fixedCostsMonthlyMajor
      : 0;
  const existing = Array.isArray(rest.expenses) ? (rest.expenses as unknown[]) : [];
  if (amount > 0 && existing.length === 0) {
    return {
      ...rest,
      expenses: [{ id: generateId(), label: 'Fixed costs', monthlyMajor: amount }],
    };
  }
  return rest;
}

export const urlStateSchema = z.object({
  s: z.array(serializedScenarioSchema).min(1).max(12),
  fx: z.number().positive().finite().optional(),
  dc: currencySchema.optional(),
  cr: z
    .object({
      minMajor: z.number().finite().nonnegative(),
      maxMajor: z.number().finite().positive(),
    })
    .optional(),
});

export type UrlState = z.infer<typeof urlStateSchema>;

export function newExpense(label = '', monthlyMajor = 0): Expense {
  return { id: generateId(), label, monthlyMajor };
}
