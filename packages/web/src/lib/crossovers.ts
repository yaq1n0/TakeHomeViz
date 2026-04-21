export interface Crossover {
  /** Index of the first scenario (the one with the lower index). */
  a: number;
  /** Index of the second scenario. */
  b: number;
  /** Gross value (display currency) where the lines cross. */
  gross: number;
  /** Spendable value at that gross (same for both by definition of a crossover). */
  spendable: number;
}

/**
 * Given N scenarios, each sampled at the same sorted `xs` grid with their
 * spendable y-values, find the x-coordinates where any pair of scenarios'
 * spendable lines cross. Uses linear interpolation between adjacent samples;
 * if two samples are exactly equal we treat that as a grazing point and skip
 * it (returning it would produce visual noise).
 */
export function findCrossovers(xs: number[], ys: Array<Array<number | null>>): Crossover[] {
  const out: Crossover[] = [];
  const n = ys.length;
  for (let a = 0; a < n; a += 1) {
    for (let b = a + 1; b < n; b += 1) {
      const ya = ys[a];
      const yb = ys[b];
      if (!ya || !yb) continue;
      for (let i = 0; i < xs.length - 1; i += 1) {
        const x0 = xs[i];
        const x1 = xs[i + 1];
        const a0 = ya[i];
        const a1 = ya[i + 1];
        const b0 = yb[i];
        const b1 = yb[i + 1];
        if (
          x0 === undefined ||
          x1 === undefined ||
          a0 == null ||
          a1 == null ||
          b0 == null ||
          b1 == null
        ) {
          continue;
        }
        const d0 = a0 - b0;
        const d1 = a1 - b1;
        // Strict sign change — grazing contact (one endpoint exactly equal) is ignored.
        if ((d0 > 0 && d1 < 0) || (d0 < 0 && d1 > 0)) {
          const t = d0 / (d0 - d1);
          const x = x0 + t * (x1 - x0);
          const y = a0 + t * (a1 - a0);
          out.push({ a, b, gross: x, spendable: y });
        }
      }
    }
  }
  return out;
}
