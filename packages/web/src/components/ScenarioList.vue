<script setup lang="ts">
import { useScenariosStore } from '../stores/scenarios';
import ScenarioPane from './ScenarioPane.vue';

const store = useScenariosStore();
</script>

<template>
  <div class="flex overflow-x-auto divide-x divide-neutral-200 dark:divide-neutral-800">
    <div v-for="(_, i) in store.scenarios" :key="i" class="shrink-0 grow basis-[360px]">
      <ScenarioPane :index="i" />
    </div>
  </div>
</template>
