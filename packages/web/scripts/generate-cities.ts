#!/usr/bin/env tsx
import { Country, City } from 'country-state-city';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'src', 'data');
const CITIES_DIR = resolve(DATA_DIR, 'cities');

const supported: string[] = JSON.parse(
  readFileSync(resolve(DATA_DIR, 'supported-countries.json'), 'utf8'),
);

const countries = supported.map((code) => {
  const c = Country.getCountryByCode(code);
  if (!c) throw new Error(`Unknown ISO-2 country code in supported-countries.json: ${code}`);
  return { iso2: c.isoCode, name: c.name, emoji: c.flag };
});
writeFileSync(resolve(DATA_DIR, 'countries.json'), JSON.stringify(countries, null, 2) + '\n');

rmSync(CITIES_DIR, { recursive: true, force: true });
mkdirSync(CITIES_DIR, { recursive: true });

for (const code of supported) {
  const raw = City.getCitiesOfCountry(code) ?? [];
  const cities = raw.map((c, i) => ({
    id: `${code}-${c.stateCode ?? ''}-${i}`,
    name: c.name,
    state_code: c.stateCode ?? '',
  }));
  writeFileSync(resolve(CITIES_DIR, `${code}.json`), JSON.stringify(cities) + '\n');
  console.log(`${code}: ${cities.length} cities`);
}
