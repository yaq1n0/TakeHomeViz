# TakeHomeViz

My very own takehome pay visualizer and comparer, because I couldn't quite find one that answered "What does my actual spending money look like at various comp levels given various locations have different fixed expenses".

Plots **spendable-after-fixed-costs vs gross salary** with every scenario overlaid, so crossover points ("at what London salary do I match my Manchester spending money?") become visual instead of trial-and-error.

Static Vue app with an open-source TypeScript engine, state is encompassed by the shareable URL.

Live at **https://takehomeviz.com** ·

## What v1 supports (purposefully narrow for now)

| Region             | Year    | Income tax         | Social insurance             | Student loan     | Pension / 401(k)          |
| ------------------ | ------- | ------------------ | ---------------------------- | ---------------- | ------------------------- |
| UK England & Wales | 2026/27 | ✅                 | NI Class 1                   | Plans 1/2/4/5/PG | Salary sacrifice (flat %) |
| US California      | 2026    | Federal + CA + SDI | FICA (SS + Medicare + add'l) | — (v1.1)         | 401(k) pre-tax (flat %)   |
| US New York        | 2026    | Federal + NY + SDI | FICA                         | — (v1.1)         | 401(k) pre-tax            |
| US Washington      | 2026    | Federal only       | FICA                         | — (v1.1)         | 401(k) pre-tax            |
| US Texas           | 2026    | Federal only       | FICA                         | — (v1.1)         | 401(k) pre-tax            |

## Deliberately out of scope for v1

These are things that can be supported but were delibrately skipped for the MVP.

- RSUs, equity, vesting, ISO AMT
- Bonuses, sign-ons, deferred comp
- Marriage / filing jointly / dependents
- HSA, FSA, ISAs, LISAs, SIPPs (beyond a flat pension %)
- Self-employment, IR35, sole trader, S-corp
- Local US taxes below state level (NYC, SF)
- Scotland income tax (v1.1)
- Federal student-loan IBR (v1.1 — family-size + discretionary-income complexity)
- Real-time FX (session-level manual rate)
- Cost-of-living API integration (manual fixed-cost entry only)

## Architecture

Monorepo, pnpm workspaces:

```
takehomeviz/
├── packages/
│   ├── engine/          # pure TS, zero runtime deps — tax math
│   └── web/             # Vue 3 SPA consuming the engine
├── .github/workflows/   # CI + GitHub Pages deploy
└── PLAN.md              # design doc
```

**Engine** is pure TypeScript with zero runtime dependencies. Tax rules are expressed as **data + small pure functions** with one file per region per tax year. Currency values are a `Money` class holding integer minor units (pence/cents); floats never touch tax arithmetic. Pipelines per region encode legal precedence: UK runs salary-sacrifice → income tax → NI → student loan; US runs 401(k) → federal → state → FICA → student loan, because 401(k) reduces the base for federal/state but not FICA.

**Web** is a Vue 3 + Vite SPA. Pinia for scenario state, uPlot for the sweep graph, Tailwind for styling. All scenario state round-trips through the URL hash via lz-string — every comparison is a link. Zod validates at two trust boundaries (URL decode, form input); zod never leaks into the engine package.

## Running locally

Prerequisites: Node 24+, pnpm 10+.

Quick Start:

```bash
pnpm install
pnpm build // you need to build the engine first
pnpm dev // then you can run the websit
```
