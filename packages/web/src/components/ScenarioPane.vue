<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  listRegions,
  SUPPORTED_YEARS,
  type RegionId,
  type StudentLoanPlanId,
  type Currency,
} from '@takehomeviz/engine';
import { useScenariosStore } from '../stores/scenarios';
import { formatDisplay, formatNumber } from '../lib/format';
import { useMediaQuery } from '../lib/useMediaQuery';
import BreakdownTable from './BreakdownTable.vue';
import LocationPicker from './LocationPicker.vue';
import { numbeoUrlFor } from '../lib/numbeoUrl';
import { xeUrlFor } from '../lib/xeUrl';
import type { Location } from '../schemas';

// Mobile vs. desktop split: below md we collapse Deductions/Expenses bodies
// inside native <details open> blocks (mockup lines 493-523). At md+ we render
// them as static blocks.
const isMobile = useMediaQuery('(max-width: 767px)');

const props = defineProps<{ index: number }>();

const store = useScenariosStore();

const scenario = computed(() => store.scenarios[props.index]);
const breakdown = computed(() => store.breakdowns[props.index]);

const regions = listRegions();

const ukPlans: { id: StudentLoanPlanId; label: string }[] = [
  { id: 'uk-plan-1', label: 'Plan 1' },
  { id: 'uk-plan-2', label: 'Plan 2' },
  { id: 'uk-plan-4', label: 'Plan 4' },
  { id: 'uk-plan-5', label: 'Plan 5' },
  { id: 'uk-postgrad', label: 'Postgraduate' },
];

function planLabel(id: StudentLoanPlanId | undefined): string {
  if (!id) return '';
  return ukPlans.find((p) => p.id === id)?.label ?? id;
}

const years = computed<number[]>(() =>
  scenario.value ? SUPPORTED_YEARS[scenario.value.regionId] : [],
);

const isUk = computed(() => scenario.value?.regionId.startsWith('uk-') ?? false);

const isPrimary = computed(() => scenario.value?.currency === store.displayCurrency);

const currencySymbol = computed<string>(() => (scenario.value?.currency === 'USD' ? '$' : '£'));
const displaySymbol = computed<string>(() => (store.displayCurrency === 'USD' ? '$' : '£'));

// --- Debounced gross input ---
const grossInput = ref<string>('');
watch(
  scenario,
  (s) => {
    if (!s) return;
    grossInput.value = s.grossMajor.toLocaleString('en-US');
  },
  { immediate: true },
);

let grossTimer: number | null = null;
function onGross(e: Event): void {
  const raw = (e.target as HTMLInputElement).value;
  grossInput.value = raw;
  if (grossTimer !== null) window.clearTimeout(grossTimer);
  grossTimer = window.setTimeout(() => {
    const cleaned = raw.replace(/[, ]/g, '');
    const n = Number(cleaned);
    if (Number.isFinite(n) && n >= 0) {
      store.updateScenario(props.index, { grossMajor: n });
    }
  }, 150);
}

// --- Name ---
const nameInput = ref<string>('');
watch(
  scenario,
  (s) => {
    if (!s) return;
    nameInput.value = s.name ?? '';
  },
  { immediate: true },
);
function onNameInput(e: Event): void {
  nameInput.value = (e.target as HTMLInputElement).value;
}
function onNameBlur(e: Event): void {
  store.setScenarioName(props.index, (e.target as HTMLInputElement).value);
}

// --- Location ---
function onLocationSelect(e: {
  location: Location | null;
  suggestedRegionId: RegionId | null;
}): void {
  store.setScenarioLocation(props.index, e.location);
  if (e.suggestedRegionId) {
    store.updateScenario(props.index, { regionId: e.suggestedRegionId });
  }
}

const numbeoUrl = computed(() => {
  const loc = scenario.value?.location;
  return loc ? numbeoUrlFor(loc) : '';
});

const xeUrl = computed(() => {
  const s = scenario.value;
  if (!s || s.currency === store.displayCurrency) return '';
  return xeUrlFor(store.displayCurrency, s.currency, store.fx);
});

// --- Region / Year ---
function onRegion(e: Event): void {
  store.updateScenario(props.index, {
    regionId: (e.target as HTMLSelectElement).value as RegionId,
  });
}
function onYear(e: Event): void {
  store.updateScenario(props.index, { year: Number((e.target as HTMLSelectElement).value) });
}

// --- FX ---
const fxInput = ref<string>('');
watch(
  () => store.fx,
  (v) => {
    fxInput.value = String(v);
  },
  { immediate: true },
);
let fxTimer: number | null = null;
function onFx(e: Event): void {
  const v = (e.target as HTMLInputElement).value;
  fxInput.value = v;
  if (fxTimer !== null) window.clearTimeout(fxTimer);
  fxTimer = window.setTimeout(() => {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) store.setFx(n);
  }, 150);
}

// --- Deductions "add" inline editor ---
// Design choice: simple toggle panel that turns Pension on (default 5%) or
// toggles a Plan-2 student loan on UK regions. We do NOT introduce new
// engine-level deduction types this pass (per REFACTOR.md decision #4).
const addOpen = ref(false);
function togglePension(): void {
  const s = scenario.value;
  if (!s) return;
  if ((s.pensionPct ?? 0) > 0) {
    store.updateScenario(props.index, { pensionPct: 0 });
  } else {
    store.updateScenario(props.index, { pensionPct: 5 });
  }
}
function toggleLoan(): void {
  const s = scenario.value;
  if (!s) return;
  if (s.loan) {
    store.setPlan(props.index, null);
  } else if (isUk.value) {
    store.setPlan(props.index, 'uk-plan-2');
  }
}
function onPensionPct(e: Event): void {
  const n = Number((e.target as HTMLInputElement).value);
  if (Number.isFinite(n)) {
    store.updateScenario(props.index, { pensionPct: Math.max(0, Math.min(100, n)) });
  }
}
function onPlan(e: Event): void {
  const v = (e.target as HTMLSelectElement).value;
  store.setPlan(props.index, v === '' ? null : (v as StudentLoanPlanId));
}

// --- Expenses ---
// Local mirrors for debounced amount inputs per-expense id.
const amountInputs = ref<Record<string, string>>({});
watch(
  () => scenario.value?.expenses,
  (exps) => {
    const next: Record<string, string> = {};
    for (const e of exps ?? []) {
      next[e.id] = amountInputs.value[e.id] ?? String(e.monthlyMajor);
    }
    amountInputs.value = next;
  },
  { immediate: true, deep: true },
);

const amountTimers = new Map<string, number>();
function onExpenseLabel(id: string, e: Event): void {
  const v = (e.target as HTMLInputElement).value;
  store.updateExpense(props.index, id, { label: v });
}
function onExpenseAmount(id: string, e: Event): void {
  const raw = (e.target as HTMLInputElement).value;
  amountInputs.value[id] = raw;
  const existing = amountTimers.get(id);
  if (existing !== undefined) window.clearTimeout(existing);
  const t = window.setTimeout(() => {
    const cleaned = raw.replace(/[, ]/g, '');
    const n = Number(cleaned);
    if (Number.isFinite(n) && n >= 0) {
      store.updateExpense(props.index, id, { monthlyMajor: n });
    }
  }, 150);
  amountTimers.set(id, t);
}

// --- Summary numbers ---
function formatMoneyNative(minorPerMonth: number, currency: Currency): string {
  // Friendly whole-pound/dollar rounding for the compact summary numbers.
  const major = minorPerMonth / 100;
  return formatNumber(major, currency).replace(/\.00$/, '');
}

const takeHomePerMoNative = computed(() => {
  const b = breakdown.value;
  if (!b) return '';
  return formatMoneyNative(b.net.div(12).amount, b.net.currency);
});

const afterExpensesPerMoNative = computed(() => {
  const b = breakdown.value;
  if (!b) return '';
  return formatMoneyNative(b.spendable.div(12).amount, b.spendable.currency);
});

const takeHomePerMoDisplay = computed(() => {
  const b = breakdown.value;
  if (!b) return '';
  return formatDisplay(b.net.div(12), store.fxConfig).replace(/\.00$/, '');
});

const afterExpensesPerMoDisplay = computed(() => {
  const b = breakdown.value;
  if (!b) return '';
  return formatDisplay(b.spendable.div(12), store.fxConfig).replace(/\.00$/, '');
});

const deductionsCount = computed(() => {
  const s = scenario.value;
  if (!s) return 0;
  let n = 0;
  if ((s.pensionPct ?? 0) > 0) n += 1;
  if (s.loan) n += 1;
  return n;
});

const expensesCount = computed(() => scenario.value?.expenses?.length ?? 0);

const effectiveTax = computed(() => {
  const b = breakdown.value;
  if (!b || b.gross.amount === 0) return '0.0%';
  const rate = 1 - b.net.amount / b.gross.amount;
  return `${(rate * 100).toFixed(1)}%`;
});
</script>

<template>
  <section
    v-if="scenario && breakdown"
    class="p-5"
    :class="{ 'bg-amber-50/50 dark:bg-amber-950/20': !isPrimary }"
    :aria-label="`Scenario ${index + 1}`"
  >
    <!-- Header: name + region badge + primary indicator + remove -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2 min-w-0">
        <input
          class="text-base font-semibold bg-transparent focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-700 rounded px-1 -mx-1 min-w-0 text-neutral-900 dark:text-neutral-100"
          :value="nameInput"
          placeholder="Scenario name"
          @input="onNameInput"
          @blur="onNameBlur"
        />
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <button
          type="button"
          class="w-6 h-6 rounded flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
          :aria-label="`Duplicate scenario ${index + 1}`"
          title="duplicate"
          @click="store.duplicateScenario(index)"
        >
          <FontAwesomeIcon icon="copy" class="text-xs" />
        </button>
        <button
          v-if="store.scenarios.length > 1"
          type="button"
          class="w-6 h-6 rounded flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
          :aria-label="`Remove scenario ${index + 1}`"
          title="remove"
          @click="store.removeScenario(index)"
        >
          <FontAwesomeIcon icon="xmark" class="text-xs" />
        </button>
      </div>
    </div>

    <!-- Location (country + city) -->
    <div class="mb-4">
      <LocationPicker :location="scenario.location" @select="onLocationSelect" />
      <a
        v-if="scenario.location"
        :href="numbeoUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-2 inline-flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        <FontAwesomeIcon icon="arrow-up-right-from-square" class="text-[10px]" />
        Cost of living on Numbeo
      </a>
    </div>

    <!-- Region / year selects -->
    <div class="grid grid-cols-2 gap-2 mb-4">
      <label class="block">
        <span
          class="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
          >Tax region</span
        >
        <select
          class="mt-1 w-full bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-md px-2 py-1.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600"
          :value="scenario.regionId"
          @change="onRegion"
        >
          <option v-for="r in regions" :key="r.id" :value="r.id">{{ r.label }}</option>
        </select>
      </label>
      <label class="block">
        <span
          class="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
          >Tax year</span
        >
        <select
          class="mt-1 w-full bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-md px-2 py-1.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600"
          :value="scenario.year"
          @change="onYear"
        >
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </label>
    </div>

    <!-- Gross input -->
    <label class="block">
      <span
        class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
        >Gross (annual)</span
      >
      <div
        class="mt-1 flex items-center gap-1 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 focus-within:border-neutral-400 dark:focus-within:border-neutral-600"
      >
        <span class="text-neutral-500 dark:text-neutral-400 font-mono text-sm">{{
          currencySymbol
        }}</span>
        <input
          class="flex-1 bg-transparent focus:outline-none tabular-nums font-mono text-lg text-neutral-900 dark:text-neutral-100 min-w-0"
          inputmode="decimal"
          :value="grossInput"
          @input="onGross"
        />
      </div>
    </label>

    <!-- FX rate row (non-primary only) -->
    <label v-if="!isPrimary" class="block mt-3">
      <span
        class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
      >
        Conversion rate
        <span class="text-neutral-500 dark:text-neutral-400 normal-case">
          · {{ currencySymbol }}
          <FontAwesomeIcon icon="arrow-right" class="mx-0.5" />
          {{ displaySymbol }}
        </span>
      </span>
      <div
        class="mt-1 flex items-center gap-2 border border-amber-300 dark:border-amber-600/60 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg px-3 py-2 focus-within:border-amber-500 dark:focus-within:border-amber-500"
      >
        <input
          class="flex-1 bg-transparent focus:outline-none tabular-nums font-mono text-sm text-neutral-900 dark:text-neutral-100 min-w-0"
          inputmode="decimal"
          :value="fxInput"
          @input="onFx"
        />
      </div>
    </label>
    <a
      v-if="xeUrl"
      :href="xeUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="mt-2 inline-flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
    >
      <FontAwesomeIcon icon="arrow-up-right-from-square" class="text-[10px]" />
      Live rate on XE
    </a>

    <!-- Deductions -->
    <div class="mt-5">
      <!-- Mobile: <details open> with the heading as <summary>. The "+add"
           toggle button is moved inside the expanded body to avoid nesting
           a button inside <summary> (which would hijack the toggle click). -->
      <details v-if="isMobile" open class="group">
        <summary
          class="flex items-center justify-between cursor-pointer py-1.5 border-b border-neutral-100 dark:border-neutral-900 list-none"
        >
          <span
            class="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
            >Deductions · {{ deductionsCount }}</span
          >
          <FontAwesomeIcon
            icon="chevron-down"
            class="text-neutral-500 dark:text-neutral-400 text-xs transition-transform group-open:rotate-180"
          />
        </summary>
        <div class="mt-2">
          <div class="flex items-center justify-end mb-2">
            <button
              type="button"
              class="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              @click="addOpen = !addOpen"
            >
              <FontAwesomeIcon icon="gear" />
              <span>configure</span>
            </button>
          </div>
          <div
            v-if="addOpen"
            class="mb-2 rounded-md border border-dashed border-neutral-200 dark:border-neutral-800 p-2.5 space-y-2 text-xs"
          >
            <div class="flex items-center justify-between gap-2">
              <label class="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
                <input
                  type="checkbox"
                  :checked="(scenario.pensionPct ?? 0) > 0"
                  @change="togglePension"
                />
                <span>Pension</span>
              </label>
              <div v-if="(scenario.pensionPct ?? 0) > 0" class="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  class="w-16 bg-transparent border border-neutral-200 dark:border-neutral-800 rounded px-1.5 py-0.5 tabular-nums font-mono text-right"
                  :value="scenario.pensionPct ?? 0"
                  @input="onPensionPct"
                />
                <span class="text-neutral-500 dark:text-neutral-400 font-mono">%</span>
              </div>
            </div>
            <div class="flex items-center justify-between gap-2">
              <label class="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
                <input
                  type="checkbox"
                  :checked="!!scenario.loan"
                  :disabled="!isUk"
                  @change="toggleLoan"
                />
                <span
                  >Student loan
                  <span v-if="!isUk" class="text-neutral-500 dark:text-neutral-400"
                    >(UK only)</span
                  ></span
                >
              </label>
              <select
                v-if="scenario.loan && isUk"
                class="bg-transparent border border-neutral-200 dark:border-neutral-800 rounded px-1.5 py-0.5 text-xs"
                :value="scenario.loan.plan"
                @change="onPlan"
              >
                <option v-for="p in ukPlans" :key="p.id" :value="p.id">
                  {{ p.label }}
                </option>
              </select>
            </div>
          </div>
          <div class="space-y-1.5">
            <div
              v-if="scenario.loan"
              class="flex items-center justify-between text-sm border border-neutral-200 dark:border-neutral-800 rounded-md px-2.5 py-1.5"
            >
              <span class="text-neutral-700 dark:text-neutral-200">Student loan</span>
              <span class="font-mono text-xs text-neutral-500 dark:text-neutral-400">{{
                planLabel(scenario.loan.plan)
              }}</span>
            </div>
            <div
              v-if="(scenario.pensionPct ?? 0) > 0"
              class="flex items-center justify-between text-sm border border-neutral-200 dark:border-neutral-800 rounded-md px-2.5 py-1.5"
            >
              <span class="text-neutral-700 dark:text-neutral-200">Pension</span>
              <span class="font-mono text-xs text-neutral-500 dark:text-neutral-400"
                >{{ scenario.pensionPct }}% · sal. sac.</span
              >
            </div>
            <div
              v-if="!scenario.loan && (scenario.pensionPct ?? 0) === 0"
              class="text-xs text-neutral-500 dark:text-neutral-400 italic px-1"
            >
              None
            </div>
          </div>
        </div>
      </details>

      <!-- Desktop: static block, same content shape as before. -->
      <template v-else>
        <div class="flex items-center justify-between mb-2">
          <span
            class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
            >Deductions</span
          >
          <button
            type="button"
            class="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            @click="addOpen = !addOpen"
          >
            <FontAwesomeIcon icon="gear" />
            <span>configure</span>
          </button>
        </div>

        <!-- Inline toggle editor -->
        <div
          v-if="addOpen"
          class="mb-2 rounded-md border border-dashed border-neutral-200 dark:border-neutral-800 p-2.5 space-y-2 text-xs"
        >
          <div class="flex items-center justify-between gap-2">
            <label class="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
              <input
                type="checkbox"
                :checked="(scenario.pensionPct ?? 0) > 0"
                @change="togglePension"
              />
              <span>Pension</span>
            </label>
            <div v-if="(scenario.pensionPct ?? 0) > 0" class="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                class="w-16 bg-transparent border border-neutral-200 dark:border-neutral-800 rounded px-1.5 py-0.5 tabular-nums font-mono text-right"
                :value="scenario.pensionPct ?? 0"
                @input="onPensionPct"
              />
              <span class="text-neutral-500 dark:text-neutral-400 font-mono">%</span>
            </div>
          </div>
          <div class="flex items-center justify-between gap-2">
            <label class="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
              <input
                type="checkbox"
                :checked="!!scenario.loan"
                :disabled="!isUk"
                @change="toggleLoan"
              />
              <span
                >Student loan
                <span v-if="!isUk" class="text-neutral-500 dark:text-neutral-400"
                  >(UK only)</span
                ></span
              >
            </label>
            <select
              v-if="scenario.loan && isUk"
              class="bg-transparent border border-neutral-200 dark:border-neutral-800 rounded px-1.5 py-0.5 text-xs"
              :value="scenario.loan.plan"
              @change="onPlan"
            >
              <option v-for="p in ukPlans" :key="p.id" :value="p.id">
                {{ p.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="space-y-1.5">
          <div
            v-if="scenario.loan"
            class="flex items-center justify-between text-sm border border-neutral-200 dark:border-neutral-800 rounded-md px-2.5 py-1.5"
          >
            <span class="text-neutral-700 dark:text-neutral-200">Student loan</span>
            <span class="font-mono text-xs text-neutral-500 dark:text-neutral-400">{{
              planLabel(scenario.loan.plan)
            }}</span>
          </div>
          <div
            v-if="(scenario.pensionPct ?? 0) > 0"
            class="flex items-center justify-between text-sm border border-neutral-200 dark:border-neutral-800 rounded-md px-2.5 py-1.5"
          >
            <span class="text-neutral-700 dark:text-neutral-200">Pension</span>
            <span class="font-mono text-xs text-neutral-500 dark:text-neutral-400"
              >{{ scenario.pensionPct }}% · sal. sac.</span
            >
          </div>
          <div
            v-if="!scenario.loan && (scenario.pensionPct ?? 0) === 0"
            class="text-xs text-neutral-500 dark:text-neutral-400 italic px-1"
          >
            None
          </div>
        </div>
      </template>
    </div>

    <!-- Expenses -->
    <div class="mt-5">
      <details v-if="isMobile" open class="group">
        <summary
          class="flex items-center justify-between cursor-pointer py-1.5 border-b border-neutral-100 dark:border-neutral-900 list-none"
        >
          <span
            class="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
            >Expenses · {{ expensesCount }}</span
          >
          <FontAwesomeIcon
            icon="chevron-down"
            class="text-neutral-500 dark:text-neutral-400 text-xs transition-transform group-open:rotate-180"
          />
        </summary>
        <div class="mt-2">
          <div class="flex items-center justify-end mb-2">
            <button
              type="button"
              class="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              @click="store.addExpense(index)"
            >
              <FontAwesomeIcon icon="plus" />
              <span>add</span>
            </button>
          </div>
          <div class="space-y-1.5">
            <div
              v-for="exp in scenario.expenses ?? []"
              :key="exp.id"
              class="flex items-center gap-2 text-sm"
            >
              <input
                class="flex-1 bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 text-neutral-900 dark:text-neutral-100 min-w-0"
                :value="exp.label"
                placeholder="Label"
                @input="(e) => onExpenseLabel(exp.id, e)"
              />
              <div
                class="flex items-center gap-1 border border-neutral-200 dark:border-neutral-800 rounded-md px-2.5 py-1.5 w-28 focus-within:border-neutral-400 dark:focus-within:border-neutral-600"
              >
                <span class="text-neutral-500 dark:text-neutral-400 font-mono text-xs">{{
                  currencySymbol
                }}</span>
                <input
                  class="flex-1 bg-transparent focus:outline-none tabular-nums font-mono text-sm text-right text-neutral-900 dark:text-neutral-100 min-w-0"
                  inputmode="decimal"
                  :aria-label="`Monthly amount for ${exp.label || 'expense'}`"
                  :value="amountInputs[exp.id] ?? ''"
                  @input="(e) => onExpenseAmount(exp.id, e)"
                />
              </div>
              <button
                type="button"
                class="text-neutral-300 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-300"
                :aria-label="`Remove expense ${exp.label}`"
                @click="store.removeExpense(index, exp.id)"
              >
                <FontAwesomeIcon icon="xmark" />
              </button>
            </div>
          </div>
        </div>
      </details>

      <template v-else>
        <div class="flex items-center justify-between mb-2">
          <span
            class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
            >Expenses (monthly)</span
          >
          <button
            type="button"
            class="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            @click="store.addExpense(index)"
          >
            <FontAwesomeIcon icon="plus" />
            <span>add</span>
          </button>
        </div>
        <div class="space-y-1.5">
          <div
            v-for="exp in scenario.expenses ?? []"
            :key="exp.id"
            class="flex items-center gap-2 text-sm"
          >
            <input
              class="flex-1 bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 text-neutral-900 dark:text-neutral-100 min-w-0"
              :value="exp.label"
              placeholder="Label"
              @input="(e) => onExpenseLabel(exp.id, e)"
            />
            <div
              class="flex items-center gap-1 border border-neutral-200 dark:border-neutral-800 rounded-md px-2.5 py-1.5 w-28 focus-within:border-neutral-400 dark:focus-within:border-neutral-600"
            >
              <span class="text-neutral-500 dark:text-neutral-400 font-mono text-xs">{{
                currencySymbol
              }}</span>
              <input
                class="flex-1 bg-transparent focus:outline-none tabular-nums font-mono text-sm text-right text-neutral-900 dark:text-neutral-100 min-w-0"
                inputmode="decimal"
                :aria-label="`Monthly amount for ${exp.label || 'expense'}`"
                :value="amountInputs[exp.id] ?? ''"
                @input="(e) => onExpenseAmount(exp.id, e)"
              />
            </div>
            <button
              type="button"
              class="text-neutral-300 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-300"
              :aria-label="`Remove expense ${exp.label}`"
              @click="store.removeExpense(index, exp.id)"
            >
              <FontAwesomeIcon icon="xmark" />
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Summary -->
    <div class="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-900 space-y-1.5">
      <div class="flex items-baseline justify-between">
        <span
          class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
          >Take-home / mo</span
        >
        <span
          class="tabular-nums font-mono text-base font-semibold text-neutral-900 dark:text-neutral-100"
        >
          {{ takeHomePerMoNative
          }}<span
            v-if="!isPrimary"
            class="text-xs font-normal text-neutral-500 dark:text-neutral-400"
          >
            · {{ takeHomePerMoDisplay }}</span
          >
        </span>
      </div>
      <div class="flex items-baseline justify-between">
        <span
          class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
          >After expenses</span
        >
        <span
          class="tabular-nums font-mono text-xl font-bold text-emerald-700 dark:text-emerald-400"
        >
          {{ afterExpensesPerMoNative
          }}<span
            v-if="!isPrimary"
            class="text-sm font-medium text-emerald-700 dark:text-emerald-400"
          >
            · {{ afterExpensesPerMoDisplay }}</span
          >
        </span>
      </div>
      <div class="flex items-baseline justify-between pt-1">
        <span class="text-[11px] font-mono text-neutral-500 dark:text-neutral-400"
          >Effective tax</span
        >
        <span class="tabular-nums text-[11px] font-mono text-neutral-500 dark:text-neutral-400">{{
          effectiveTax
        }}</span>
      </div>
    </div>

    <!-- Detailed breakdown -->
    <details class="mt-4 group">
      <summary
        class="cursor-pointer list-none text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 select-none"
      >
        <FontAwesomeIcon
          icon="chevron-right"
          class="inline-block group-open:rotate-90 transition-transform"
        />
        Detailed breakdown
      </summary>
      <div class="mt-3">
        <BreakdownTable :breakdown="breakdown" />
      </div>
    </details>
  </section>
</template>
