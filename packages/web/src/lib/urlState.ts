import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import {
  urlStateSchema,
  legacyDecodeAndMigrate,
  type UrlState,
  type SerializedScenario,
} from '../schemas';
import type { Currency } from '@takehomeviz/engine';

export interface ChartRange {
  minMajor: number;
  maxMajor: number;
}

export interface DecodedUrlState {
  scenarios: SerializedScenario[];
  fx: number | undefined;
  displayCurrency: Currency | undefined;
  chartRange: ChartRange | undefined;
}

export function encodeUrlState(state: DecodedUrlState): string {
  const payload: UrlState = {
    s: state.scenarios,
    ...(state.fx !== undefined ? { fx: state.fx } : {}),
    ...(state.displayCurrency !== undefined ? { dc: state.displayCurrency } : {}),
    ...(state.chartRange !== undefined ? { cr: state.chartRange } : {}),
  };
  const json = JSON.stringify(payload);
  const compressed = compressToEncodedURIComponent(json);
  return `#s=${compressed}`;
}

export type DecodeResult = { ok: true; state: DecodedUrlState } | { ok: false; error: string };

export function decodeUrlState(hash: string): DecodeResult | null {
  const stripped = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!stripped) return null;
  const params = new URLSearchParams(stripped);
  const raw = params.get('s');
  if (!raw) return null;
  const json = decompressFromEncodedURIComponent(raw);
  if (!json) {
    return { ok: false, error: 'Share link looks corrupted (decompression failed).' };
  }
  try {
    const parsed: unknown = JSON.parse(json);
    // Migrate legacy scenario fields before strict validation.
    if (
      parsed &&
      typeof parsed === 'object' &&
      's' in parsed &&
      Array.isArray((parsed as { s: unknown[] }).s)
    ) {
      const p = parsed as { s: unknown[] };
      p.s = p.s.map(legacyDecodeAndMigrate);
    }
    const validated = urlStateSchema.parse(parsed);
    return {
      ok: true,
      state: {
        scenarios: validated.s,
        fx: validated.fx,
        displayCurrency: validated.dc,
        chartRange: validated.cr,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Share link is invalid: ${message}` };
  }
}
