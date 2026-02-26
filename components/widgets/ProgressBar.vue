<template>
  <div class="w-full">
    <div class="flex justify-between items-center mb-1.5" v-if="showLabels">
      <span class="text-xs text-gray-500">{{ minLabel }}</span>
      <span class="text-xs text-gray-500">{{ maxLabel }}</span>
    </div>
    <div class="h-2 bg-[#2a2a3a] rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-700"
        :style="{ width: `${clampedPercent}%`, background: barGradient }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  value: number
  min: number
  max: number
  showLabels?: boolean
  minLabel?: string
  maxLabel?: string
}>()

const clampedPercent = computed(() => {
  const pct = ((props.value - props.min) / (props.max - props.min)) * 100
  return Math.min(100, Math.max(0, pct))
})

const barGradient = computed(() => {
  const pct = clampedPercent.value
  if (pct <= 25) return 'linear-gradient(90deg, #00d68f, #40e0a0)'
  if (pct <= 50) return 'linear-gradient(90deg, #00d68f, #ffb700)'
  if (pct <= 75) return 'linear-gradient(90deg, #ffb700, #ff7f00)'
  return 'linear-gradient(90deg, #ff7f00, #ff4757)'
})
</script>
