import type { SerializedScenario } from '../schemas';

/**
 * Pre-seeded comparison: London vs Manchester vs San Francisco.
 * Loaded whenever the URL hash is empty or fails to decode.
 */
export const exampleScenarios: SerializedScenario[] = [
  {
    regionId: 'uk-eng',
    year: 2026,
    grossMajor: 95_000,
    currency: 'GBP',
    name: 'London',
    pensionPct: 5,
    loan: { plan: 'uk-plan-2' },
    expenses: [
      { id: 'ex_london_rent', label: 'Rent', monthlyMajor: 2_100 },
      { id: 'ex_london_util', label: 'Utilities + internet', monthlyMajor: 180 },
    ],
  },
  {
    regionId: 'uk-eng',
    year: 2026,
    grossMajor: 72_000,
    currency: 'GBP',
    name: 'Manchester',
    pensionPct: 5,
    loan: { plan: 'uk-plan-2' },
    expenses: [
      { id: 'ex_mcr_rent', label: 'Rent', monthlyMajor: 1_200 },
      { id: 'ex_mcr_util', label: 'Utilities + internet', monthlyMajor: 150 },
    ],
  },
  {
    regionId: 'us-ca',
    year: 2026,
    grossMajor: 220_000,
    currency: 'USD',
    name: 'San Francisco',
    pensionPct: 6,
    expenses: [
      { id: 'ex_sf_rent', label: 'Rent', monthlyMajor: 3_400 },
      { id: 'ex_sf_util', label: 'Utilities + internet', monthlyMajor: 220 },
    ],
  },
];

export const exampleFx = 0.79;
export const exampleDisplayCurrency = 'GBP' as const;
