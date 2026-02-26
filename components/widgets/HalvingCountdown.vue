<template>
  <div class="card">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <!-- Left: title -->
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="text-2xl">⛏️</span>
          <span class="section-title">比特幣減半倒數</span>
        </div>
        <div class="text-xs text-gray-500">每 210,000 個區塊礦工獎勵減半，歷史上的大行情催化劑</div>
      </div>

      <!-- Countdown -->
      <div v-if="store.halvingLoading" class="shimmer h-16 w-64 rounded-xl" />
      <div v-else-if="store.halvingData" class="flex items-center gap-4">
        <!-- Timer boxes -->
        <div class="flex gap-3">
          <div v-for="unit in timeUnits" :key="unit.label" class="text-center">
            <div class="bg-[#1e1e2e] rounded-xl px-4 py-3 min-w-[4rem]">
              <div class="font-mono text-3xl font-bold text-white leading-none">
                {{ String(unit.value).padStart(2, '0') }}
              </div>
            </div>
            <div class="text-[10px] text-gray-500 mt-1.5 uppercase tracking-wider">{{ unit.label }}</div>
          </div>
        </div>
      </div>

      <!-- Right: block info -->
      <div v-if="store.halvingData" class="flex flex-col md:flex-row gap-4">
        <div class="bg-[#1e1e2e] rounded-xl p-4 text-center min-w-[9rem]">
          <div class="metric-label mb-1">當前區塊</div>
          <div class="font-mono text-lg font-semibold text-white">
            #{{ store.halvingData.currentBlock.toLocaleString() }}
          </div>
        </div>
        <div class="bg-[#1e1e2e] rounded-xl p-4 text-center min-w-[9rem]">
          <div class="metric-label mb-1">剩餘區塊</div>
          <div class="font-mono text-lg font-semibold text-[#f7931a]">
            {{ store.halvingData.blocksRemaining.toLocaleString() }}
          </div>
        </div>
        <div class="bg-[#1e1e2e] rounded-xl p-4 text-center min-w-[9rem]">
          <div class="metric-label mb-1">獎勵</div>
          <div class="font-mono text-sm font-semibold text-white">
            {{ store.halvingData.currentReward.toFixed(3) }} BTC
          </div>
          <div class="text-[10px] text-gray-500 mt-0.5">
            → {{ store.halvingData.nextReward.toFixed(4) }} BTC
          </div>
        </div>
        <div class="bg-[#1e1e2e] rounded-xl p-4 text-center min-w-[9rem]">
          <div class="metric-label mb-1">預計減半日期</div>
          <div class="font-mono text-sm font-semibold text-white">
            {{ formatDate(store.halvingData.estimatedDate) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Progress bar -->
    <div v-if="store.halvingData" class="mt-5">
      <div class="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>第 {{ currentEpoch }} 減半週期</span>
        <span>{{ progressPercent.toFixed(1) }}% 完成</span>
      </div>
      <div class="h-2 bg-[#2a2a3a] rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-1000"
          style="background: linear-gradient(90deg, #f7931a, #ffb700)"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBtcStore } from '~/stores/btc'

const store = useBtcStore()

const BLOCKS_PER_HALVING = 210_000

const currentEpoch = computed(() => {
  if (!store.halvingData) return 0
  return Math.floor(store.halvingData.currentBlock / BLOCKS_PER_HALVING) + 1
})

const progressPercent = computed(() => {
  if (!store.halvingData) return 0
  const blockInCycle = store.halvingData.currentBlock % BLOCKS_PER_HALVING
  return (blockInCycle / BLOCKS_PER_HALVING) * 100
})

const timeUnits = computed(() => {
  if (!store.halvingData) return []
  return [
    { label: '天', value: store.halvingData.daysRemaining },
    { label: '時', value: store.halvingData.hoursRemaining },
    { label: '分', value: store.halvingData.minutesRemaining },
  ]
})

function formatDate(date: Date) {
  return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>
