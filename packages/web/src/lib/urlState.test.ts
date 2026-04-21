import { decodeUrlState, encodeUrlState, type DecodedUrlState } from './urlState';
import type { SerializedScenario } from '../schemas';

const baseScenario: SerializedScenario = {
  regionId: 'uk-eng',
  year: 2026,
  grossMajor: 80_000,
  currency: 'GBP',
};

describe('encodeUrlState / decodeUrlState round-trip', () => {
  it('round-trips a simple state deep-equal', () => {
    const state: DecodedUrlState = {
      scenarios: [baseScenario],
      fx: 0.8,
      displayCurrency: 'USD',
      chartRange: { minMajor: 0, maxMajor: 200000 },
    };
    const hash = encodeUrlState(state);
    const decoded = decodeUrlState(hash);
    expect(decoded?.ok).toBe(true);
    if (decoded?.ok) expect(decoded.state).toEqual(state);
  });

  it('omits optional fields when undefined', () => {
    const state: DecodedUrlState = {
      scenarios: [baseScenario],
      fx: undefined,
      displayCurrency: undefined,
      chartRange: undefined,
    };
    const hash = encodeUrlState(state);
    const decoded = decodeUrlState(hash);
    expect(decoded?.ok).toBe(true);
    if (decoded?.ok) {
      expect(decoded.state.fx).toBeUndefined();
      expect(decoded.state.displayCurrency).toBeUndefined();
      expect(decoded.state.chartRange).toBeUndefined();
    }
  });
});

describe('decodeUrlState — empty / missing', () => {
  it("returns null for ''", () => {
    expect(decodeUrlState('')).toBeNull();
  });
  it("returns null for '#'", () => {
    expect(decodeUrlState('#')).toBeNull();
  });
  it('returns null when hash has no s= param', () => {
    expect(decodeUrlState('#other=foo')).toBeNull();
  });
});

describe('decodeUrlState — error paths', () => {
  it('reports decompression failure for malformed lz-string payload', () => {
    const result = decodeUrlState('#s=!!notvalid!!');
    expect(result?.ok).toBe(false);
    if (result && !result.ok) expect(result.error).toMatch(/decompression/i);
  });

  it('returns zod error for out-of-range year', () => {
    const hash = encodeUrlState({
      scenarios: [{ ...baseScenario, year: 1800 }],
      fx: undefined,
      displayCurrency: undefined,
      chartRange: undefined,
    });
    const result = decodeUrlState(hash);
    expect(result?.ok).toBe(false);
  });

  it('returns zod error for negative grossMajor', () => {
    const hash = encodeUrlState({
      scenarios: [{ ...baseScenario, grossMajor: -1 }],
      fx: undefined,
      displayCurrency: undefined,
      chartRange: undefined,
    });
    const result = decodeUrlState(hash);
    expect(result?.ok).toBe(false);
  });

  it('returns zod error for empty scenarios list', () => {
    const hash = encodeUrlState({
      scenarios: [],
      fx: undefined,
      displayCurrency: undefined,
      chartRange: undefined,
    });
    const result = decodeUrlState(hash);
    expect(result?.ok).toBe(false);
  });

  it('returns an error (not throw) for tampered base64-ish junk', () => {
    const result = decodeUrlState('#s=AAAAAAAAAAAAAA');
    expect(result).not.toBeNull();
    expect(result?.ok).toBe(false);
  });
});

import { compressToEncodedURIComponent } from 'lz-string';

describe('legacy migration inside decodeUrlState', () => {
  function encodeRaw(payload: unknown): string {
    return `#s=${compressToEncodedURIComponent(JSON.stringify(payload))}`;
  }

  it('migrates fixedCostsMonthlyMajor with no expenses to a single Fixed costs expense', () => {
    const hash = encodeRaw({
      s: [{ ...baseScenario, fixedCostsMonthlyMajor: 500 }],
    });
    const result = decodeUrlState(hash);
    expect(result?.ok).toBe(true);
    if (result?.ok) {
      const s = result.state.scenarios[0]!;
      expect(s.expenses).toHaveLength(1);
      expect(s.expenses![0]!.label).toBe('Fixed costs');
      expect(s.expenses![0]!.monthlyMajor).toBe(500);
    }
  });

  it('drops legacy field when expenses already exist (keeps existing expenses untouched)', () => {
    const existing = [{ id: 'ex_1', label: 'Rent', monthlyMajor: 1000 }];
    const hash = encodeRaw({
      s: [{ ...baseScenario, fixedCostsMonthlyMajor: 500, expenses: existing }],
    });
    const result = decodeUrlState(hash);
    expect(result?.ok).toBe(true);
    if (result?.ok) expect(result.state.scenarios[0]!.expenses).toEqual(existing);
  });

  it('drops legacy field with value 0 without synthesising an expense', () => {
    const hash = encodeRaw({
      s: [{ ...baseScenario, fixedCostsMonthlyMajor: 0 }],
    });
    const result = decodeUrlState(hash);
    expect(result?.ok).toBe(true);
    if (result?.ok) expect(result.state.scenarios[0]!.expenses).toBeUndefined();
  });
});
