import { Money } from '@takehomeviz/engine';
import {
  formatCompact,
  formatDisplay,
  formatNumber,
  formatPercent,
  moneyFromMajor,
  moneyToDisplay,
  type FxConfig,
} from './format';

const gbpFx: FxConfig = { gbpPerUsd: 0.8, displayCurrency: 'GBP' };
const usdFx: FxConfig = { gbpPerUsd: 0.8, displayCurrency: 'USD' };

describe('moneyToDisplay', () => {
  it('returns major value unchanged when currency matches display', () => {
    expect(moneyToDisplay(new Money(12345, 'GBP'), gbpFx)).toBeCloseTo(123.45, 10);
    expect(moneyToDisplay(new Money(10000, 'USD'), usdFx)).toBeCloseTo(100, 10);
  });

  it('converts USD → GBP by multiplying by gbpPerUsd', () => {
    expect(moneyToDisplay(new Money(10000, 'USD'), gbpFx)).toBeCloseTo(80, 10);
  });

  it('converts GBP → USD by dividing by gbpPerUsd', () => {
    expect(moneyToDisplay(new Money(10000, 'GBP'), usdFx)).toBeCloseTo(125, 10);
  });

  it('preserves sign on negative amounts', () => {
    expect(moneyToDisplay(new Money(-5000, 'GBP'), gbpFx)).toBeCloseTo(-50, 10);
    expect(moneyToDisplay(new Money(-10000, 'USD'), gbpFx)).toBeCloseTo(-80, 10);
  });

  it('scales minor→major with /100', () => {
    expect(moneyToDisplay(new Money(1, 'GBP'), gbpFx)).toBeCloseTo(0.01, 10);
  });
});

describe('formatNumber', () => {
  it('uses £ for GBP and $ for USD', () => {
    expect(formatNumber(1, 'GBP')).toBe('£1.00');
    expect(formatNumber(1, 'USD')).toBe('$1.00');
  });

  it('pads to two decimals', () => {
    expect(formatNumber(1.1, 'GBP')).toBe('£1.10');
    expect(formatNumber(1, 'GBP')).toBe('£1.00');
  });

  it('places negative sign before the symbol', () => {
    expect(formatNumber(-1234, 'GBP')).toBe('-£1,234.00');
    expect(formatNumber(-1234.5, 'USD')).toBe('-$1,234.50');
  });

  it('inserts thousands separators', () => {
    expect(formatNumber(1234567.89, 'USD')).toBe('$1,234,567.89');
  });
});

describe('formatCompact', () => {
  it('shows raw value under 1k', () => {
    expect(formatCompact(999, 'GBP')).toBe('£999');
    expect(formatCompact(0, 'USD')).toBe('$0');
  });

  it('uses k for >= 1_000 and < 1_000_000', () => {
    expect(formatCompact(1000, 'GBP')).toBe('£1k');
    expect(formatCompact(999_999, 'USD')).toBe('$1000k');
  });

  it('uses M for >= 1_000_000', () => {
    expect(formatCompact(1_000_000, 'GBP')).toBe('£1.0M');
    expect(formatCompact(2_500_000, 'USD')).toBe('$2.5M');
  });

  it('preserves sign', () => {
    expect(formatCompact(-1500, 'GBP')).toBe('£-2k');
  });
});

describe('formatPercent', () => {
  it('formats 0, fraction, 1, and >1', () => {
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(0.123)).toBe('12.3%');
    expect(formatPercent(1)).toBe('100.0%');
    expect(formatPercent(1.5)).toBe('150.0%');
  });
});

describe('moneyFromMajor', () => {
  it('rounds to nearest integer minor unit', () => {
    expect(moneyFromMajor(1.006, 'GBP').amount).toBe(101);
    expect(moneyFromMajor(1.004, 'GBP').amount).toBe(100);
  });

  it('preserves currency', () => {
    expect(moneyFromMajor(10, 'USD').currency).toBe('USD');
    expect(moneyFromMajor(10, 'GBP').currency).toBe('GBP');
  });

  it('handles zero and negative', () => {
    expect(moneyFromMajor(0, 'GBP').amount).toBe(0);
    expect(moneyFromMajor(-5.5, 'USD').amount).toBe(-550);
  });
});

describe('formatDisplay', () => {
  it('uses display currency formatting after conversion', () => {
    expect(formatDisplay(new Money(10000, 'USD'), gbpFx)).toBe('£80.00');
  });
});
