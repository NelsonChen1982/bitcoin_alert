<template>
  <div class="card card-hover h-full">
    <div class="flex items-start justify-between mb-4">
      <div>
        <div class="section-title">200 週均線</div>
        <div class="section-desc">歷史底部支撐，比特幣不敗神線</div>
      </div>
      <SignalBadge :signal="signal" />
    </div>

    <div class="mb-4 grid grid-cols-2 gap-3">
      <div class="bg-[#1e1e2e] rounded-xl p-3">
        <div class="metric-label mb-1">現價</div>
        <div v-if="store.priceLoading" class="shimmer h-7 w-20 rounded" />
        <div v-else class="font-mono text-xl font-semibold text-white">
          {{ formatPrice(store.currentPrice) }}
        </div>
      </div>
      <div class="bg-[#1e1e2e] rounded-xl p-3">
        <div class="metric-label mb-1">200週均線</div>
        <div v-if="store.historyLoading" class="shimmer h-7 w-20 rounded" />
        <div v-else class="font-mono text-xl font-semibold text-[#4facfe]">
          {{ formatPrice(store.ma200Week) }}
        </div>
      </div>
    </div>

    <!-- Ratio display -->
    <div class="bg-[#1e1e2e] rounded-xl p-3 mb-4">
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-400">現價 / 200週均線</span>
        <span class="font-mono text-lg font-semibold" :class="valueColor">
          {{ ratioDisplay }}x
        </span>
      </div>
      <div class="mt-2">
        <ProgressBar
          :value="ratio ?? 1"
          :min="0.5"
          :max="5"
          :show-labels="true"
          min-label="0.5x 歷史底"
          max-label="5x 歷史頂"
        />
      </div>
    </div>

    <p class="text-xs text-gray-500 leading-relaxed">{{ signal.description }}</p>
  </div>
</template>

<script setup lang="ts">
import { useBtcStore } from '~/stores/btc'
import { getMA200WSignal } from '~/utils/signals'
import { formatPrice } from '~/utils/calculations'

const store = useBtcStore()
const signal = computed(() => getMA200WSignal(store.currentPrice, store.ma200Week))

const ratio = computed(() => {
  if (!store.currentPrice || !store.ma200Week) return null
  return store.currentPrice / store.ma200Week
})

const ratioDisplay = computed(() => {
  if (ratio.value === null) return '—'
  return ratio.value.toFixed(2)
})

const valueColor = computed(() => {
  const level = signal.value.level
  if (level === 'green') return 'text-[#00d68f]'
  if (level === 'yellow') return 'text-[#ffb700]'
  if (level === 'orange') return 'text-[#ff7f00]'
  if (level === 'red') return 'text-[#ff4757]'
  return 'text-white'
})
</script>
