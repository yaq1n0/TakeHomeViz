# LinkedIn

**Short version (~1,200 characters, lands in the feed without "see more"):**

I spent the last few months comparing job offers across London, Manchester, SF, and NYC — and every tool I used answered the wrong question.

UK calculators handle UK tax only. US paycheck calculators handle US tax only. Numbeo uses a national-average tax rate that's wrong by 20 points of effective marginal at the top end and ignores student loans completely.

The question I actually had was: *at what London salary does my spendable income match a given SF offer, after tax and after rent?*

So I built the tool that answers it. TakeHomeViz.com — multi-region take-home pay comparisons with a graph of spendable-vs-gross, every scenario overlaid, crossover points annotated. Free, open-source (MIT), no accounts, no tracking. Every comparison is a shareable URL.

For the engineers: the tax engine is its own zero-dependency TypeScript package. Tax rules are data + small pure functions, one file per region per tax year, so updates are boring. Integer-minor-units `Money` class so floats never touch tax arithmetic. Property-based tests for monotonicity and non-negativity.

If you're job-searching across borders, or you're an engineer who likes clean little DSLs: https://takehomeviz.com

Source: https://github.com/yaq1n0/TakeHomeViz

---

**Long version (for a LinkedIn article — ~600 words):**

When I started interviewing across the UK and US this year, I expected the hard part to be the interviews. It turned out to be the math afterwards.

A recruiter sends you a number. Your brain multiplies it by 12, subtracts "some tax," compares it to your current comp, and then — because you're moving cities, maybe countries — you realize rent is 2.5× different and a Tube pass and a BART pass are not the same kind of cost. The spreadsheet comes out. Two hours later you've accidentally become an amateur tax researcher.

The tools that exist cover pieces of this:

- UK calculators (thesalarycalculator.co.uk is the best one I found) handle UK income tax, National Insurance, and all five student loan plans. UK-only, closed source.
- US paycheck calculators handle federal + state tax and FICA. US-only.
- Cost-of-living comparison tools (Numbeo, Expatistan) treat tax as a national average and ignore student loans. That's fine for a tourist planning a trip; useless for an offer comparison.

What I wanted was a tool that handled all of it at once, side-by-side, with a graph showing how each offer's spendable income scales with gross — so that crossover points ("at what salary does London match SF?") became visual instead of trial-and-error.

**So I built TakeHomeViz.**

A scenario is: region, tax year, gross, pension or 401(k) %, student loan plan, monthly fixed costs. You add as many as you want. Every scenario becomes a line on the chart showing spendable-after-fixed-costs as a function of gross. Crossover points fall out naturally.

The engineering choices that mattered most:

- **The tax engine is its own package.** Zero runtime dependencies. Pure TypeScript. Framework-agnostic. You can embed it in any project — I've already had two people ask.
- **Tax rules are data, not code.** Each region's income tax or NI or FICA schedule is a small file listing bands and rates, citing the official government source. Adding the 2027/28 UK bands when HMRC publishes them will be one pull request.
- **Integer minor units.** Currency lives as pennies and cents, not floats. Floating-point arithmetic on tax-band boundaries produces subtle wrongness at scale.
- **No backend, no accounts, no tracking.** The entire comparison state encodes into the URL, compressed. Every scenario you build is a shareable link.

V1 is deliberately small. No RSUs, no marriage/dependents, no Scotland (coming), no NYC local tax, no real-time FX. These are explicit non-goals — the architecture is built to extend, but breadth is not a v1 goal.

If you're weighing offers across countries: https://takehomeviz.com — I'd love to hear whether it matches what your payslip actually shows.

If you're an engineer and you like clean little DSLs for real-world rules: the source is MIT on GitHub and the design doc is published alongside it.

Open to feedback, spot-checks against your own paystub, and pull requests.

#opensource #typescript #compensation #jobsearch
