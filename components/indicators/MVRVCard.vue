<template>
  <div class="card card-hover h-full">
    <div class="flex items-start justify-between mb-4">
      <div>
        <div class="section-title">MVRV Ratio</div>
        <div class="section-desc">市值 / 實現市值 — 判斷宏觀頂底</div>
      </div>
      <SignalBadge :signal="signal" />
    </div>

    <div class="mb-4">
      <div v-if="store.onChainLoading" class="shimmer h-10 w-28 rounded-lg" />
      <div v-else class="flex items-end gap-2">
        <span class="metric-value" :class="valueColor">
          {{ mvrvDisplay }}
        </span>
        <span class="text-gray-500 text-sm mb-1">x</span>
      </div>
    </div>

    <ProgressBar
      :value="store.mvrvValue ?? 0"
      :min="0.5"
      :max="7"
      :show-labels="true"
      min-label="底部 (&lt;1)"
      max-label="頂部 (&gt;5)"
    />

    <!-- Zones -->
    <div class="mt-4 space-y-1.5">
      <div v-for="zone in zones" :key="zone.label"
        class="flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors"
        :class="isActiveZone(zone) ? zone.activeBg : 'bg-[#1e1e2e]'"
      >
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: zone.color }" />
          <span class="text-xs text-gray-300">{{ zone.label }}</span>
        </div>
        <span class="text-xs text-gray-500">{{ zone.range }}</span>
      </div>
    </div>

    <p class="mt-3 text-xs text-gray-500 leading-relaxed">{{ signal.description }}</p>
  </div>
</template>

<script setup lang="ts">
import { useBtcStore } from '~/stores/btc'
import { getMVRVSignal } from '~/utils/signals'

const store = useBtcStore()
const signal = computed(() => getMVRVSignal(store.mvrvValue))

const mvrvDisplay = computed(() => {
  if (store.mvrvValue === null) return '—'
  return store.mvrvValue.toFixed(2)
})

const valueColor = computed(() => {
  const level = signal.value.level
  if (level === 'green') return 'text-[#00d68f]'
  if (level === 'yellow') return 'text-[#ffb700]'
  if (level === 'orange') return 'text-[#ff7f00]'
  if (level === 'red') return 'text-[#ff4757]'
  return 'text-white'
})

const zones = [
  { label: '極度低估', range: '< 1', min: -Infinity, max: 1, color: '#00d68f', activeBg: 'bg-[#00d68f]/15 ring-1 ring-[#00d68f]/40' },
  { label: '低估區', range: '1 – 2', min: 1, max: 2, color: '#40d890', activeBg: 'bg-[#40d890]/15 ring-1 ring-[#40d890]/40' },
  { label: '合理估值', range: '2 – 3.5', min: 2, max: 3.5, color: '#ffb700', activeBg: 'bg-[#ffb700]/15 ring-1 ring-[#ffb700]/40' },
  { label: '偏貴', range: '3.5 – 5', min: 3.5, max: 5, color: '#ff7f00', activeBg: 'bg-[#ff7f00]/15 ring-1 ring-[#ff7f00]/40' },
  { label: '極度高估', range: '> 5', min: 5, max: Infinity, color: '#ff4757', activeBg: 'bg-[#ff4757]/15 ring-1 ring-[#ff4757]/40' },
]

function isActiveZone(zone: typeof zones[0]) {
  const v = store.mvrvValue
  if (v === null) return false
  return v >= zone.min && v < zone.max
}
</script>
