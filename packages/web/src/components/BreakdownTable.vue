<script setup lang="ts">
import { computed } from 'vue';
import type { Breakdown } from '@takehomeviz/engine';
import { formatDisplay, formatPercent } from '../lib/format';
import { useScenariosStore } from '../stores/scenarios';

const props = defineProps<{ breakdown: Breakdown }>();

const store = useScenariosStore();

const rows = computed(() => {
  return props.breakdown.deductions.map((d) => {
    const meta = d.meta as { marginalRate?: number } | undefined;
    return {
      name: d.name,
      native: d.amount.toString(),
      display:
        d.amount.currency === store.displayCurrency
          ? null
          : formatDisplay(d.amount, store.fxConfig),
      marginal: meta?.marginalRate !== undefined ? formatPercent(meta.marginalRate) : '—',
      after: d.taxableBaseAfter.toString(),
    };
  });
});

const showDisplayCol = computed(() => props.breakdown.gross.currency !== store.displayCurrency);

const fixedAnnual = computed(() => {
  const fc = props.breakdown.scenario.fixedCostsMonthly;
  if (!fc) return null;
  return fc.mul(12);
});
</script>

<template>
  <div
    class="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
  >
    <table data-testid="breakdown-table" class="w-full text-sm">
      <thead
        class="bg-neutral-50 dark:bg-neutral-900 text-left text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
      >
        <tr>
          <th class="px-3 py-2 font-medium">Line</th>
          <th class="px-3 py-2 text-right font-medium">Amount</th>
          <th v-if="showDisplayCol" class="px-3 py-2 text-right font-medium">Display</th>
          <th class="px-3 py-2 text-right font-medium">Marginal</th>
          <th class="px-3 py-2 text-right font-medium">Base after</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-neutral-100 dark:divide-neutral-900">
        <tr class="bg-neutral-50/50 dark:bg-neutral-900/50 font-medium">
          <td class="px-3 py-2 text-neutral-900 dark:text-neutral-100">Gross</td>
          <td
            class="px-3 py-2 text-right tabular-nums font-mono text-neutral-900 dark:text-neutral-100"
          >
            {{ breakdown.gross.toString() }}
          </td>
          <td
            v-if="showDisplayCol"
            class="px-3 py-2 text-right tabular-nums font-mono text-neutral-500 dark:text-neutral-400"
          >
            {{ formatDisplay(breakdown.gross, store.fxConfig) }}
          </td>
          <td class="px-3 py-2 text-right text-neutral-500 dark:text-neutral-400">—</td>
          <td
            class="px-3 py-2 text-right tabular-nums font-mono text-neutral-500 dark:text-neutral-400"
          >
            {{ breakdown.gross.toString() }}
          </td>
        </tr>
        <tr v-for="(row, i) in rows" :key="i">
          <td class="px-3 py-2 text-neutral-700 dark:text-neutral-200">
            {{ row.name }}
          </td>
          <td
            class="px-3 py-2 text-right tabular-nums font-mono text-neutral-900 dark:text-neutral-100"
          >
            − {{ row.native }}
          </td>
          <td
            v-if="showDisplayCol"
            class="px-3 py-2 text-right tabular-nums font-mono text-neutral-500 dark:text-neutral-400"
          >
            {{ row.display ?? '' }}
          </td>
          <td
            class="px-3 py-2 text-right tabular-nums font-mono text-neutral-500 dark:text-neutral-400"
          >
            {{ row.marginal }}
          </td>
          <td
            class="px-3 py-2 text-right tabular-nums font-mono text-neutral-500 dark:text-neutral-400"
          >
            {{ row.after }}
          </td>
        </tr>
        <tr class="bg-neutral-50/50 dark:bg-neutral-900/50 font-medium">
          <td class="px-3 py-2 text-neutral-900 dark:text-neutral-100">Net (take-home)</td>
          <td
            class="px-3 py-2 text-right tabular-nums font-mono text-neutral-900 dark:text-neutral-100"
          >
            {{ breakdown.net.toString() }}
          </td>
          <td
            v-if="showDisplayCol"
            class="px-3 py-2 text-right tabular-nums font-mono text-neutral-500 dark:text-neutral-400"
          >
            {{ formatDisplay(breakdown.net, store.fxConfig) }}
          </td>
          <td
            class="px-3 py-2 text-right tabular-nums font-mono text-neutral-500 dark:text-neutral-400"
          >
            {{ formatPercent(breakdown.marginalRate) }}
          </td>
          <td class="px-3 py-2 text-right text-neutral-500 dark:text-neutral-400">—</td>
        </tr>
        <tr v-if="fixedAnnual">
          <td class="px-3 py-2 text-neutral-700 dark:text-neutral-200">Fixed costs (annual)</td>
          <td
            class="px-3 py-2 text-right tabular-nums font-mono text-neutral-900 dark:text-neutral-100"
          >
            − {{ fixedAnnual.toString() }}
          </td>
          <td
            v-if="showDisplayCol"
            class="px-3 py-2 text-right tabular-nums font-mono text-neutral-500 dark:text-neutral-400"
          >
            {{ formatDisplay(fixedAnnual, store.fxConfig) }}
          </td>
          <td class="px-3 py-2 text-right text-neutral-500 dark:text-neutral-400">—</td>
          <td class="px-3 py-2 text-right text-neutral-500 dark:text-neutral-400">—</td>
        </tr>
        <tr
          class="bg-emerald-50 dark:bg-emerald-950/30 font-semibold text-emerald-900 dark:text-emerald-300"
        >
          <td class="px-3 py-2">Spendable</td>
          <td class="px-3 py-2 text-right tabular-nums font-mono">
            {{ breakdown.spendable.toString() }}
          </td>
          <td v-if="showDisplayCol" class="px-3 py-2 text-right tabular-nums font-mono">
            {{ formatDisplay(breakdown.spendable, store.fxConfig) }}
          </td>
          <td class="px-3 py-2 text-right text-neutral-500 dark:text-neutral-400">—</td>
          <td class="px-3 py-2 text-right text-neutral-500 dark:text-neutral-400">—</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
