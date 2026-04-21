/**
 * Branded tax-year value. An integer in [2000, 2100]. Use the `year()` factory
 * to construct; the brand prevents accidentally passing a raw number.
 *
 * @example
 *   const y = year(2026);   // Year
 *   year(2026.5);           // throws
 */

declare const YearBrand: unique symbol;
export type Year = number & { readonly [YearBrand]: true };

export function year(n: number): Year {
  if (!Number.isInteger(n)) {
    throw new TypeError(`Year must be an integer, got ${n}`);
  }
  if (n < 2000 || n > 2100) {
    throw new RangeError(`Year out of range: must be in [2000, 2100], got ${n}`);
  }
  return n as Year;
}
