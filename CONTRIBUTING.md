# Contributing - updating the logic

The rules-as-data design makes it so that that tax-year updates should be ~one file and one PR. Here's the flow:

1. Open an issue using the **"Tax bands changed"** template (auto-loaded from `.github/ISSUE_TEMPLATE`).
2. Copy the existing band file for that region, bump the year in the filename and the `effectiveFrom` date:
   ```
   packages/engine/src/regions/uk/bands/income-tax-2026-27.ts
   → packages/engine/src/regions/uk/bands/income-tax-2027-28.ts
   ```
3. Update `bands[]` values. **Include the `source:` URL** pointing to gov.uk / irs.gov / ftb.ca.gov — every band schedule must cite its authority. The commit message should link the same source.
4. Add reference scenarios to the region's test file using worked examples from the authority's own documentation (HMRC worked examples, IRS Publication 15-T examples, etc.). One reference scenario per income bracket is plenty.
5. Register the new year in `packages/engine/src/calculate.ts` under `SUPPORTED_YEARS`.
6. Run `pnpm -r test:run`. Property-based tests (monotonicity, non-negativity, totals ≤ gross) run automatically and will catch any band that accidentally produces a negative marginal rate or a tax bill exceeding gross income.

If a rule is uncertain, leave `// TODO(contributor): verify` and flag it in the PR — don't guess. Tax math has a single right answer per scenario and silent wrongness is worse than a visible gap.

# Contributing — adding a new region

1. Create `packages/engine/src/regions/<country>/<region>/` with `bands/` and `deductions/` subdirectories.
2. Assemble the pipeline in a `<region>.ts` file exporting a `Region` object with its currency, label, and ordered `Deduction[]`. Pipeline order encodes legal precedence — get it right.
3. Add the `RegionId` to the union in `packages/engine/src/types.ts`, register it in `packages/engine/src/regions/index.ts`, and add an entry to `SUPPORTED_YEARS`.
4. Reference tests, as above.
