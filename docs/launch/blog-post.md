# I was comparing job offers across countries. No tool did the one thing I actually needed.

A few months ago I started interviewing for roles in London, Manchester, San Francisco, and New York. Every time I got to the compensation conversation I'd pull up a spreadsheet, plug in a gross, subtract the taxes I could remember, and then — because the whole *point* was to compare them — try to mentally normalize for rent and transit costs that differ by a factor of 3×.

The tools I already used kept coming up short in the same way:

- **thesalarycalculator.co.uk** nails UK tax + NI + student loans. UK only.
- **SmartAsset** and **ADP's paycheck calculator** handle US federal + state. US only.
- **Numbeo** compares cities on cost-of-living — but uses a single "national average" tax rate that misses 20 points of effective marginal rate at the top end, and completely ignores student loans.

The question I actually wanted answered was: *at what London salary does my spendable income match an $X offer in SF, after tax and after fixed costs?* That's a graph. A line per offer, x-axis = gross, y-axis = spendable-after-rent, and I want to see where they cross.

So I built that. It's at **https://takehomeviz.com** and the source is on GitHub.

## The core insight is the graph

![Screenshot of the sweep chart with three scenarios overlaid and crossover points annotated.](./screenshots/sweep-chart.png)

A scenario is: region + tax year + gross + pension/401(k) % + student loan plan + monthly fixed costs. Add as many as you want. Every scenario becomes a line on the chart showing **spendable** (net minus fixed costs, annualized) as a function of gross.

Crossover points fall out naturally: where two lines intersect is the gross on line A that matches line B's current spendable. No mental arithmetic, no iteration, just read it off the chart.

Concrete example from the pre-loaded comparison: a $350k SF offer at 10% 401(k) with $6k/mo fixed costs lands at about the same spendable as a £150k London offer at 8% pension with £3.5k/mo fixed costs. The chart shows this as one click. A spreadsheet would take me fifteen minutes and three tabs.

## What's under the hood (for the engineers)

The tax engine is its own npm-publishable package — `@takehomeviz/engine`. Zero runtime dependencies, pure TypeScript, framework-agnostic, fully deterministic. Tax rules are expressed as **data + small pure functions**, one file per region per tax year. A new UK tax year is one PR that adds one band file and bumps a lookup. That's the whole point — tax calculators rot when nobody updates them, so the architecture needs to make updates boring.

Currency values are a `Money` class holding integer minor units (pence / cents). Float arithmetic on currency is a bug waiting to happen once you start hitting band boundaries and banker's-rounding edge cases. All arithmetic stays on integers; floats appear only at the UI boundary.

Each region exports an ordered pipeline of deductions. Order encodes legal precedence:

- **UK:** salary-sacrifice pension → income tax → NI → student loan. Salary sacrifice reduces the base for both income tax *and* NI, which is the whole reason it's a pipeline rather than a flat list.
- **US:** 401(k) pre-tax → federal income tax → state income tax → FICA → student loan. 401(k) reduces the base for federal/state but **not** FICA; FICA runs against gross-minus-401(k), not against the income-taxable base after state.

Tests cover: reference scenarios per region with worked examples from gov.uk and IRS Publication 15-T, plus property-based tests for monotonicity (gross↑ ⇒ net↑), non-negativity, and totals-never-exceed-gross.

The frontend is Vue 3 + Vite + Pinia + uPlot + Tailwind. All scenario state round-trips through the URL hash via lz-string, so every comparison is a shareable link. There is no backend, no account system, no analytics.

## What v1 deliberately does not do

There's a long list in [PLAN.md §3](https://github.com/yaq1n0/TakeHomeViz/blob/main/PLAN.md) of things that aren't in v1 on purpose. The short version: no RSUs, no marriage/dependents, no IRAs/HSAs/ISAs beyond a flat pension %, no local US taxes below state, no Scotland (v1.1), no real-time FX. These are non-goals, not oversights. The modular architecture is the v1 feature; breadth is not.

## Try it

- **Site:** https://takehomeviz.com
- **Code:** https://github.com/yaq1n0/TakeHomeViz (MIT-licensed)
- **Engine on npm:** `@takehomeviz/engine`

If you spot a number that disagrees with an authoritative source, please open an issue — there's a template for it. If you want to add a tax year or a region, the contributor guide in the README is the entire recipe and PRs are welcome.
