/**
 * Currency-aware monetary value stored as integer minor units.
 *
 * Float arithmetic on currency is a bug waiting to happen — banker's-rounding
 * edge cases and tax-band boundary issues compound quickly. All arithmetic is
 * done on integer minor units (pence / cents); conversion to floats happens
 * only at the UI layer.
 *
 * @example
 *   const gross = new Money(50_000_00, 'GBP'); // £50,000.00
 *   const pension = gross.mul(0.05);            // £2,500.00
 *   const postPension = gross.sub(pension);     // £47,500.00
 */

export type Currency = 'GBP' | 'USD';

const CURRENCIES = new Set<Currency>(['GBP', 'USD']);

export class Money {
  readonly amount: number;
  readonly currency: Currency;

  constructor(amount: number, currency: Currency) {
    if (!Number.isFinite(amount)) {
      throw new TypeError(`Money.amount must be a finite number, got ${amount}`);
    }
    if (!Number.isInteger(amount)) {
      throw new TypeError(
        `Money.amount must be an integer (minor units), got ${amount}. ` +
          `Convert float currency values with Math.round(value * 100).`,
      );
    }
    if (!CURRENCIES.has(currency)) {
      throw new TypeError(`Money.currency must be one of GBP, USD; got ${String(currency)}`);
    }
    this.amount = amount;
    this.currency = currency;
  }

  static zero(currency: Currency): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other, 'add');
    return new Money(this.amount + other.amount, this.currency);
  }

  sub(other: Money): Money {
    this.assertSameCurrency(other, 'sub');
    return new Money(this.amount - other.amount, this.currency);
  }

  /**
   * Multiply by a scalar, rounding half-to-even (banker's rounding) back to
   * integer minor units. Banker's rounding is the default for IEEE 754 and
   * avoids the systematic bias of half-away-from-zero for large aggregates.
   */
  mul(scalar: number): Money {
    if (!Number.isFinite(scalar)) {
      throw new TypeError(`Money.mul scalar must be a finite number, got ${scalar}`);
    }
    return new Money(bankersRound(this.amount * scalar), this.currency);
  }

  /**
   * Divide by a scalar with banker's rounding.
   */
  div(scalar: number): Money {
    if (!Number.isFinite(scalar) || scalar === 0) {
      throw new TypeError(`Money.div scalar must be a finite non-zero number, got ${scalar}`);
    }
    return new Money(bankersRound(this.amount / scalar), this.currency);
  }

  neg(): Money {
    return new Money(-this.amount, this.currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isNegative(): boolean {
    return this.amount < 0;
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  lt(other: Money): boolean {
    this.assertSameCurrency(other, 'lt');
    return this.amount < other.amount;
  }

  lte(other: Money): boolean {
    this.assertSameCurrency(other, 'lte');
    return this.amount <= other.amount;
  }

  gt(other: Money): boolean {
    this.assertSameCurrency(other, 'gt');
    return this.amount > other.amount;
  }

  gte(other: Money): boolean {
    this.assertSameCurrency(other, 'gte');
    return this.amount >= other.amount;
  }

  eq(other: Money): boolean {
    return this.currency === other.currency && this.amount === other.amount;
  }

  /**
   * Pick the larger of two Money values (same currency).
   */
  static max(a: Money, b: Money): Money {
    a.assertSameCurrency(b, 'max');
    return a.amount >= b.amount ? a : b;
  }

  static min(a: Money, b: Money): Money {
    a.assertSameCurrency(b, 'min');
    return a.amount <= b.amount ? a : b;
  }

  toString(): string {
    const sign = this.amount < 0 ? '-' : '';
    const abs = Math.abs(this.amount);
    const major = Math.floor(abs / 100);
    const minor = abs % 100;
    const symbol = this.currency === 'GBP' ? '£' : '$';
    return `${sign}${symbol}${major.toLocaleString('en-US')}.${minor.toString().padStart(2, '0')}`;
  }

  toJSON(): { amount: number; currency: Currency } {
    return { amount: this.amount, currency: this.currency };
  }

  private assertSameCurrency(other: Money, op: string): void {
    if (this.currency !== other.currency) {
      throw new TypeError(`Money.${op}: currency mismatch (${this.currency} vs ${other.currency})`);
    }
  }
}

/**
 * Half-to-even rounding ("banker's rounding"). For exact halves, rounds toward
 * the nearest even integer; otherwise behaves like Math.round (but correct for
 * negative halves, which Math.round gets wrong for our purposes).
 */
export function bankersRound(n: number): number {
  const floor = Math.floor(n);
  const diff = n - floor;
  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;
  return floor % 2 === 0 ? floor : floor + 1;
}
