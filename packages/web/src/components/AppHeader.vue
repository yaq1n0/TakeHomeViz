<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Currency } from '@takehomeviz/engine';
import { useScenariosStore } from '../stores/scenarios';
import { toggleTheme, useTheme } from '../lib/theme';

const store = useScenariosStore();

const theme = useTheme();
const themeLabel = computed(() =>
  theme.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
);

const shareState = ref<'idle' | 'copied' | 'error'>('idle');
let shareTimer: number | null = null;

async function onShare(): Promise<void> {
  const url = window.location.href;
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(url);
      shareState.value = 'copied';
    } else {
      // Fallback: select an off-screen input — best-effort.
      const input = document.createElement('input');
      input.value = url;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
        shareState.value = 'copied';
      } catch {
        shareState.value = 'error';
      }
      document.body.removeChild(input);
    }
  } catch {
    shareState.value = 'error';
  }
  if (shareTimer !== null) window.clearTimeout(shareTimer);
  shareTimer = window.setTimeout(() => {
    shareState.value = 'idle';
  }, 1500);
}

function setPrimary(c: Currency): void {
  store.setDisplayCurrency(c);
}
</script>

<template>
  <header
    data-testid="app-header"
    class="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 md:px-6 dark:border-neutral-800"
  >
    <div class="flex items-baseline gap-3">
      <h1 class="text-lg font-bold tracking-tight">
        <button
          type="button"
          class="group inline-flex items-baseline gap-2 rounded px-1 -mx-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600"
          :aria-label="themeLabel"
          :title="themeLabel"
          @click="toggleTheme"
        >
          <span>TakeHomeViz</span>
          <span
            class="relative inline-block h-4 w-4 text-neutral-500 group-hover:text-neutral-900 dark:text-neutral-400 dark:group-hover:text-neutral-100"
            aria-hidden="true"
          >
            <Transition name="theme-toggle-icon">
              <FontAwesomeIcon
                v-if="theme === 'dark'"
                key="moon"
                icon="moon"
                class="absolute inset-0 h-4 w-4"
              />
              <FontAwesomeIcon v-else key="sun" icon="sun" class="absolute inset-0 h-4 w-4" />
            </Transition>
          </span>
        </button>
      </h1>
      <span class="text-xs font-mono text-neutral-500 dark:text-neutral-400"
        >v0.1 · open source</span
      >
    </div>
    <div class="ml-auto flex items-center gap-2">
      <div class="flex items-center gap-1 text-xs">
        <span class="mr-1 text-neutral-500 dark:text-neutral-400">Primary</span>
        <button
          type="button"
          class="h-8 w-8 rounded-md border font-mono text-sm"
          :class="
            store.displayCurrency === 'GBP'
              ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
              : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900'
          "
          aria-label="GBP primary"
          @click="setPrimary('GBP')"
        >
          £
        </button>
        <button
          type="button"
          class="h-8 w-8 rounded-md border font-mono text-sm"
          :class="
            store.displayCurrency === 'USD'
              ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
              : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900'
          "
          aria-label="USD primary"
          @click="setPrimary('USD')"
        >
          $
        </button>
      </div>
      <div class="mx-1 h-6 w-px bg-neutral-200 dark:bg-neutral-800" />
      <button
        type="button"
        class="hidden h-8 items-center gap-1.5 rounded-md border border-neutral-200 px-3 text-xs font-medium hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 md:flex dark:border-neutral-800 dark:hover:bg-neutral-900"
        :disabled="store.scenarios.length >= 12"
        @click="store.addScenario()"
      >
        <FontAwesomeIcon icon="plus" class="h-3.5 w-3.5" />
        Add scenario
      </button>
      <button
        type="button"
        class="flex h-8 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-xs font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        @click="onShare"
      >
        <FontAwesomeIcon v-if="shareState !== 'copied'" icon="share-nodes" class="h-3.5 w-3.5" />
        <FontAwesomeIcon v-else icon="check" class="h-3.5 w-3.5" />
        <span>{{
          shareState === 'copied' ? 'Copied' : shareState === 'error' ? 'Error' : 'Share'
        }}</span>
      </button>
    </div>
  </header>
</template>
