import type { Currency } from '@takehomeviz/engine';

export function xeUrlFor(from: Currency, to: Currency, amount: number): string {
  const params = new URLSearchParams({
    Amount: String(amount),
    From: from,
    To: to,
  });
  return `https://www.xe.com/en-gb/currencyconverter/convert/?${params.toString()}`;
}
