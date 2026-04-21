# `@takehomeviz/web` Testing Plan

Two test layers, no middle tier:

- **Vitest unit tests** — pure functions in `src/lib/*` and the Pinia store in `src/stores/scenarios.ts`. Fast, isolated, deterministic.
- **Playwright E2E tests** — the app running in a real browser. Component-level behaviour (rendering, events, reactivity) is validated transitively through E2Es rather than with dedicated component tests.

Out of scope: visual regression (future work), engine logic (covered by `@takehomeviz/engine`'s own suite — assumed correct here).

---

## 1. Tooling

### Vitest

- Add dev deps: `vitest`, `@vitest/coverage-v8`, `jsdom`.
- `vite.config.ts` gains a `test` block: `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./test/setup.ts']`.
- `test/setup.ts` stubs `matchMedia`, `localStorage`, and `crypto.randomUUID` where defaults aren't adequate.
- Scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:cov": "vitest run --coverage"`.
- Target: unit coverage ≥ 90% for `src/lib/*` and `src/stores/scenarios.ts`.

### Playwright

- New workspace package `packages/web-e2e` (or top-level `e2e/`) so the web bundle stays free of test deps.
- Config: single `chromium` project by default, `webkit` + mobile viewport project for the mobile-tabs flow. `webServer` runs `pnpm --filter @takehomeviz/web dev` (or `vite preview` against a built artifact in CI).
- Scripts: `"e2e": "playwright test"`, `"e2e:ui": "playwright test --ui"`.
- CI runs against the built bundle (`vite build` + `vite preview`) so the test target matches production.

---

## 2. Unit tests (Vitest)

### `lib/format.ts` — [format.test.ts](src/lib/format.test.ts)

- `moneyToDisplay`: same-currency passthrough; USD→GBP applies `gbpPerUsd`; GBP→USD divides; negative amounts preserved; minor→major scaling (amount/100) is correct.
- `formatNumber`: symbol selection per currency; two-decimal padding; negative sign placement before symbol (`-£1,234.00`); thousands separators.
- `formatCompact`: `< 1k` / `1k–1M` / `≥ 1M` thresholds; rounding direction at boundaries (999, 1000, 999_999, 1_000_000).
- `formatPercent`: `0`, `0.123`, `1`, values > 1.
- `moneyFromMajor`: rounds half-cent inputs correctly; preserves currency; handles `0` and negative majors.

### `lib/crossovers.ts` — [crossovers.test.ts](src/lib/crossovers.test.ts)

- Two monotonic non-crossing lines → `[]`.
- Two lines with one strict crossing → single result with `a < b` and interpolated `gross`/`spendable` within the bracketing interval.
- Three scenarios with multiple pairwise crossings → correct count and pair indices.
- Grazing contact (`d0 === 0` or `d1 === 0`) → ignored (no result), per the docstring invariant.
- `null` gaps in `ys` → intervals containing a `null` endpoint are skipped silently.
- Empty `xs` / `xs` of length 1 → `[]` without throwing.
- Interpolation accuracy: construct lines with a known analytical crossing; assert `gross` and `spendable` within `1e-9`.

### `lib/urlState.ts` — [urlState.test.ts](src/lib/urlState.test.ts)

- Round-trip: `encodeUrlState(x)` → `decodeUrlState(hash).state` deep-equals `x`.
- Round-trip preserves optional fields only when set (no `fx`/`dc`/`cr` keys when undefined).
- `decodeUrlState('')` and `decodeUrlState('#')` → `null`.
- Hash with missing `s=` param → `null`.
- Malformed lz-string payload → `{ ok: false, error }` mentioning decompression.
- Valid JSON but zod-invalid (e.g. `year: 1800`, `grossMajor: -1`, empty `s`) → `{ ok: false, error }` with zod message.
- Legacy migration: payload containing `fixedCostsMonthlyMajor` with no `expenses` → migrated to single `Fixed costs` expense; with existing `expenses` → legacy field dropped, expenses untouched; with `fixedCostsMonthlyMajor: 0` → dropped, no synthetic expense.
- Tampered but syntactically valid hash (random base64) → returns an error rather than throwing.

### `lib/theme.ts` — [theme.test.ts](src/lib/theme.test.ts)

- `initTheme()` with stored `'dark'` → applies `dark` class, ignores system preference.
- `initTheme()` with no stored value → follows `prefers-color-scheme`.
- System change event after stored preference exists → no-op.
- System change event with no stored preference → applies new theme.
- `setTheme` persists to localStorage and toggles the class.
- `toggleTheme()` flips light↔dark.
- `localStorage.getItem` throws → falls back silently (covers private-browsing Safari).

### `lib/useMediaQuery.ts` — [useMediaQuery.test.ts](src/lib/useMediaQuery.test.ts)

- Inside a `defineComponent` harness (`@vue/test-utils` only as a Vitest dev dep): returns initial `matches` value; updates on `change` event; `removeEventListener` called on unmount.
- SSR branch (`window === undefined`) → returns `ref(false)` without error.
- Safari fallback path (`addListener`/`removeListener`) — stub `mql` without `addEventListener` and assert the legacy methods fire.

### `schemas.ts` — [schemas.test.ts](src/schemas.test.ts)

- `serializedScenarioSchema`: accepts minimal valid shape; rejects out-of-range `pensionPct`, invalid `regionId`, `year` < 2000 / > 2100, negative `grossMajor`, expenses > 20.
- `legacyDecodeAndMigrate` behaviour already covered in `urlState.test.ts`; add a direct test for non-object / null input passthrough.
- `newExpense` produces unique ids across successive calls.

### `stores/scenarios.ts` — [scenarios.test.ts](src/stores/scenarios.test.ts)

Setup: `createPinia()` + `setActivePinia()` per test; stub `window.location.hash`, `history.replaceState`.

- `loadFromHash` with empty hash → seeds example scenarios, clears `loadError`.
- `loadFromHash` with valid encoded state → populates store; `activeScenarioIndex` clamped when the new list is shorter.
- `loadFromHash` with corrupt hash → falls back to examples, sets `loadError`.
- `dismissLoadError` clears the error.
- `addScenario` appends using the previous scenario's region; picks a supported year for that region.
- `removeScenario` no-op when length ≤ 1; clamps `activeScenarioIndex` when removing the last one.
- `updateScenario` with a region change resets currency, snaps `year` into supported range, drops incompatible student loan plan (UK↔US boundary).
- `setScenarioName`: empty/whitespace removes the `name` field; non-empty trims and sets it.
- `setPlan(null)` drops `loan`; non-null sets it.
- `addExpense` / `updateExpense` / `removeExpense`: ids preserved, last expense removal drops the `expenses` key entirely.
- `setFx` rejects non-positive / non-finite inputs.
- `setActiveScenarioIndex` clamps to valid range.
- Derived: `engineScenarios` maps each serialized scenario to engine shape with `Money` conversion (assert `amount` and `currency`, don't re-test engine math).
- Derived: `breakdowns` has the same length as `scenarios` and each entry is the engine output (stub `calculate` via `vi.mock('@takehomeviz/engine', ...)` or just assert structural shape).
- Derived: `sweepSeries` returns `xs` of length ≤ 250, non-decreasing; series length matches scenario count; respects `chartRange` when set; auto-scales to `1.5× max grossMajor` when unset.
- URL-write watcher: debounced — mutating `scenarios` three times in quick succession produces exactly one `history.replaceState` call after the 200ms debounce (use `vi.useFakeTimers()`).

---

## 3. E2E tests (Playwright)

Fixtures: a `seed(hash)` helper that navigates to `/#s=<encoded>` with a pre-built scenario set for deterministic starting state. A `seedDefault()` helper that navigates to `/` and waits for example scenarios to render.

### Smoke — [smoke.spec.ts](../web-e2e/tests/smoke.spec.ts)

- App loads, header visible, sweep chart canvas attached to DOM, no console errors.
- Keyboard tab order reaches every interactive control in the active pane.

### Scenario editing

- Change gross salary → breakdown table values update; chart re-renders (assert a new `<canvas>` data frame via a mutation observer, or just that `store.sweepSeries` feeds through by checking a spendable cell).
- Change region (UK → US) → currency symbol in inputs flips to `$`, year dropdown re-populates with US years, UK student-loan plan is cleared.
- Change pension % → displayed take-home changes.
- Add / edit / delete expense rows — totals reflect in the breakdown's "Fixed costs" line.
- Rename a scenario — name appears in the tab/list label and persists in the URL.

### Student loan plans

- Enable `uk-plan-2` in a UK scenario → breakdown shows student loan deduction.
- Disable → deduction row disappears.
- Switch region UK→US with a UK plan active → plan is dropped (regression test for the boundary in `updateScenario`).

### Multi-scenario & crossovers

- Start with 2 scenarios that cross → chart shows at least one crossover marker.
- Add a 3rd scenario → list has 3 panes on desktop.
- Remove a scenario → clamped to 1 minimum (button disabled at length 1).

### Currency & FX

- Toggle display currency USD↔GBP → all formatted values flip symbol and magnitude.
- Change FX rate → USD-native scenario's displayed GBP take-home updates accordingly.

### URL state persistence

- Edit scenarios → reload the page → state is restored from the URL hash (not the examples).
- Copy the URL, open in a fresh context → identical state renders.
- Manually corrupt the hash (`goto('/#s=garbage')`) → the amber load-error banner appears; Dismiss clears it; example scenarios are rendered.
- Legacy URL with `fixedCostsMonthlyMajor` (pre-built fixture) → migrates to an expense row labelled "Fixed costs".

### Chart behaviour

- Set a custom chart range → x-axis extent matches; reset → auto-scales.
- Hover the chart → tooltip/legend updates (if implemented) — otherwise assert no uncaught errors on pointer move.
- Zero-gross scenario → chart renders without crashing.

### Responsive layout

- Desktop viewport (≥ 768px): `ScenarioList` visible, `MobileScenarioTabs` not.
- Mobile viewport (e.g. 375×812): tabs visible, only the active `ScenarioPane` is in the DOM; tapping a tab switches the pane.

### Theme

- Toggle dark mode → `<html>` gets the `dark` class; reload preserves the choice.
- Clear localStorage + set OS preference to dark → app boots dark.

### Accessibility smoke

- Run `@axe-core/playwright` on the default and a dark-mode page; fail on `serious`/`critical` violations.

---

## 4. Open items / future work

- Screenshot regression for `SweepChart` (Playwright `toHaveScreenshot`) — deferred.
- Performance budget (bundle size, chart render time) — not covered here.
- Cross-browser E2E beyond Chromium + one WebKit mobile profile.
