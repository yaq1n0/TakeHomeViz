import { describe, it, expect } from 'vitest';
import { regionFromLocation } from './regionFromLocation';

describe('regionFromLocation', () => {
  it('maps GB to uk-eng', () => {
    expect(regionFromLocation('GB')).toBe('uk-eng');
    expect(regionFromLocation('GB', 'SCT')).toBe('uk-eng');
  });

  it('maps modeled US states to their region ids', () => {
    expect(regionFromLocation('US', 'CA')).toBe('us-ca');
    expect(regionFromLocation('US', 'NY')).toBe('us-ny');
    expect(regionFromLocation('US', 'WA')).toBe('us-wa');
    expect(regionFromLocation('US', 'TX')).toBe('us-tx');
  });

  it('returns null for unmodeled US states', () => {
    expect(regionFromLocation('US', 'FL')).toBeNull();
    expect(regionFromLocation('US', 'OR')).toBeNull();
  });

  it('returns null when US state code is missing', () => {
    expect(regionFromLocation('US')).toBeNull();
    expect(regionFromLocation('US', undefined)).toBeNull();
  });

  it('returns null for unmodeled countries', () => {
    expect(regionFromLocation('FR')).toBeNull();
    expect(regionFromLocation('DE', 'BY')).toBeNull();
    expect(regionFromLocation('CA', 'ON')).toBeNull();
  });
});
