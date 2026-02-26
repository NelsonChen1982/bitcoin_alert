<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
    :class="signalClasses"
  >
    <span class="w-1.5 h-1.5 rounded-full inline-block" :style="{ backgroundColor: dotColor }" />
    {{ signal.label }}
  </span>
</template>

<script setup lang="ts">
import type { Signal } from '~/types/indicators'
import { getSignalClasses, getSignalDotColor } from '~/utils/signals'

const props = defineProps<{ signal: Signal }>()

const signalClasses = computed(() => getSignalClasses(props.signal.level))
const dotColor = computed(() => getSignalDotColor(props.signal.level))
</script>
