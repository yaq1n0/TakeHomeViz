import { describe, it, expect } from 'vitest';
import { xeUrlFor } from './xeUrl';

describe('xeUrlFor', () => {
  it('builds XE converter URL for GBP primary / USD scenario', () => {
    expect(xeUrlFor('GBP', 'USD', 0.84)).toBe(
      'https://www.xe.com/en-gb/currencyconverter/convert/?Amount=0.84&From=GBP&To=USD',
    );
  });

  it('reverses direction when primary/scenario swap', () => {
    expect(xeUrlFor('USD', 'GBP', 1.19)).toBe(
      'https://www.xe.com/en-gb/currencyconverter/convert/?Amount=1.19&From=USD&To=GBP',
    );
  });
});
