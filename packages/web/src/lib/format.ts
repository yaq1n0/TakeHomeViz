import { Money, type Currency } from '@takehomeviz/engine';

/**
 * FX rate is expressed as "GBP per USD" — i.e. 0.79 means $1 = £0.79.
 * Stored as a single scalar so the user only has to maintain one number.
 */
export interface FxConfig {
  gbpPerUsd: number;
  displayCurrency: Currency;
}

const currencySymbol: Record<Currency, string> = { GBP: '£', USD: '$' };

/**
 * Convert a `Money` value to a float in the requested display currency.
 * Returns a float — only use at the UI layer, never inside engine math.
 */
export function moneyToDisplay(money: Money, fx: FxConfig): number {
  const major = money.amount / 100;
  if (money.currency === fx.displayCurrency) return major;
  if (money.currency === 'USD' && fx.displayCurrency === 'GBP') {
    return major * fx.gbpPerUsd;
  }
  // GBP → USD
  return major / fx.gbpPerUsd;
}

export function formatDisplay(money: Money, fx: FxConfig): string {
  const n = moneyToDisplay(money, fx);
  return formatNumber(n, fx.displayCurrency);
}

export function formatNumber(n: number, currency: Currency): string {
  const symbol = currencySymbol[currency];
  const abs = Math.abs(n);
  const fixed = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${n < 0 ? '-' : ''}${symbol}${fixed}`;
}

export function formatCompact(n: number, currency: Currency): string {
  const symbol = currencySymbol[currency];
  const abs = Math.abs(n);
  let v: string;
  if (abs >= 1_000_000) v = `${(n / 1_000_000).toFixed(1)}M`;
  else if (abs >= 1_000) v = `${(n / 1_000).toFixed(0)}k`;
  else v = n.toFixed(0);
  return `${symbol}${v}`;
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * Build a Money from a major-unit float entered by the user. Rounds to the
 * nearest integer minor unit so downstream engine math stays exact.
 */
export function moneyFromMajor(major: number, currency: Currency): Money {
  return new Money(Math.round(major * 100), currency);
}
