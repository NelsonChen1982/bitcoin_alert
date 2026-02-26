<template>
  <div class="card card-hover h-full">
    <div class="flex items-start justify-between mb-4">
      <div>
        <div class="section-title">Bitcoin Z-Score</div>
        <div class="section-desc">價格偏離 200 週均線的標準差</div>
      </div>
      <SignalBadge :signal="signal" />
    </div>

    <div class="mb-5">
      <div v-if="store.historyLoading" class="shimmer h-10 w-24 rounded-lg" />
      <div v-else class="flex items-end gap-2">
        <span class="metric-value" :class="valueColor">
          {{ zScoreDisplay }}
        </span>
        <span class="text-gray-500 text-sm mb-1">σ</span>
      </div>
    </div>

    <!-- Z-Score ruler visualization -->
    <div class="mb-4">
      <div class="relative h-8 rounded-full overflow-hidden"
        style="background: linear-gradient(90deg, #00d68f 0%, #40d890 20%, #ffb700 45%, #ff7f00 70%, #ff4757 100%)"
      >
        <!-- Marker -->
        <div
          v-if="store.zScore !== null"
          class="absolute top-0 w-0.5 h-full bg-white shadow-lg transition-all duration-700"
          :style="{ left: `${markerPercent}%` }"
        />
      </div>
      <div class="flex justify-between mt-1">
        <span class="text-[10px] text-gray-500">0</span>
        <span class="text-[10px] text-gray-500">2</span>
        <span class="text-[10px] text-gray-500">4</span>
        <span class="text-[10px] text-gray-500">6</span>
        <span class="text-[10px] text-gray-500">8+</span>
      </div>
    </div>

    <!-- Historical reference -->
    <div class="bg-[#1e1e2e] rounded-xl p-3 mb-3">
      <div class="text-xs text-gray-400 mb-2">歷史參考</div>
      <div class="space-y-1.5">
        <div class="flex justify-between items-center">
          <span class="text-xs text-[#00d68f]">◎ 2015 底部</span>
          <span class="text-xs font-mono text-gray-400">Z ≈ 0.1</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-[#00d68f]">◎ 2018 底部</span>
          <span class="text-xs font-mono text-gray-400">Z ≈ -0.2</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-[#ff4757]">◎ 2017 頂部</span>
          <span class="text-xs font-mono text-gray-400">Z ≈ 8.0</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-[#ff4757]">◎ 2021 頂部</span>
          <span class="text-xs font-mono text-gray-400">Z ≈ 7.5</span>
        </div>
      </div>
    </div>

    <p class="text-xs text-gray-500 leading-relaxed">{{ signal.description }}</p>
  </div>
</template>

<script setup lang="ts">
import { useBtcStore } from '~/stores/btc'
import { getZScoreSignal } from '~/utils/signals'

const store = useBtcStore()
const signal = computed(() => getZScoreSignal(store.zScore))

const zScoreDisplay = computed(() => {
  if (store.zScore === null) return '—'
  return store.zScore.toFixed(2)
})

const valueColor = computed(() => {
  const level = signal.value.level
  if (level === 'green') return 'text-[#00d68f]'
  if (level === 'yellow') return 'text-[#ffb700]'
  if (level === 'orange') return 'text-[#ff7f00]'
  if (level === 'red') return 'text-[#ff4757]'
  return 'text-white'
})

// Map Z-Score (0 to 8+) to 0-100%
const markerPercent = computed(() => {
  const z = store.zScore ?? 0
  return Math.min(100, Math.max(0, (z / 8) * 100))
})
</script>
