import {
  legacyDecodeAndMigrate,
  newExpense,
  serializedScenarioSchema,
  urlStateSchema,
} from './schemas';

const validScenario = {
  regionId: 'uk-eng',
  year: 2026,
  grossMajor: 80_000,
  currency: 'GBP',
} as const;

describe('serializedScenarioSchema', () => {
  it('accepts a minimal valid scenario', () => {
    expect(serializedScenarioSchema.parse(validScenario)).toMatchObject(validScenario);
  });

  it('rejects pensionPct out of [0, 100]', () => {
    expect(() => serializedScenarioSchema.parse({ ...validScenario, pensionPct: -1 })).toThrow();
    expect(() => serializedScenarioSchema.parse({ ...validScenario, pensionPct: 101 })).toThrow();
  });

  it('rejects invalid regionId', () => {
    expect(() =>
      serializedScenarioSchema.parse({ ...validScenario, regionId: 'fr-idf' }),
    ).toThrow();
  });

  it('rejects year < 2000 or > 2100', () => {
    expect(() => serializedScenarioSchema.parse({ ...validScenario, year: 1999 })).toThrow();
    expect(() => serializedScenarioSchema.parse({ ...validScenario, year: 2101 })).toThrow();
  });

  it('rejects negative grossMajor', () => {
    expect(() => serializedScenarioSchema.parse({ ...validScenario, grossMajor: -1 })).toThrow();
  });

  it('rejects >20 expenses', () => {
    const expenses = Array.from({ length: 21 }, (_, i) => ({
      id: `e${i}`,
      label: 'x',
      monthlyMajor: 1,
    }));
    expect(() => serializedScenarioSchema.parse({ ...validScenario, expenses })).toThrow();
  });
});

describe('urlStateSchema', () => {
  it('requires at least one scenario', () => {
    expect(() => urlStateSchema.parse({ s: [] })).toThrow();
  });
});

describe('legacyDecodeAndMigrate', () => {
  it('returns non-object input unchanged', () => {
    expect(legacyDecodeAndMigrate(null)).toBeNull();
    expect(legacyDecodeAndMigrate(undefined)).toBeUndefined();
    expect(legacyDecodeAndMigrate(42)).toBe(42);
    expect(legacyDecodeAndMigrate('foo')).toBe('foo');
  });

  it('passes through objects without the legacy field', () => {
    const input = { a: 1 };
    expect(legacyDecodeAndMigrate(input)).toEqual(input);
  });
});

describe('newExpense', () => {
  it('produces unique ids across successive calls', () => {
    const a = newExpense();
    const b = newExpense();
    const c = newExpense();
    expect(new Set([a.id, b.id, c.id]).size).toBe(3);
  });

  it('uses provided defaults', () => {
    const e = newExpense('Rent', 100);
    expect(e.label).toBe('Rent');
    expect(e.monthlyMajor).toBe(100);
  });
});
