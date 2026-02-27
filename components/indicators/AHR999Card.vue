<template>
  <div class="card card-hover h-full">
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <div>
        <div class="section-title">AHR999 囤幣指標</div>
        <div class="section-desc">指導定投 / 抄底時機</div>
      </div>
      <SignalBadge :signal="signal" />
    </div>

    <!-- Value -->
    <div class="mb-4">
      <div v-if="store.historyLoading || store.priceLoading" class="shimmer h-10 w-32 rounded-lg" />
      <div v-else class="flex items-end gap-2">
        <span class="metric-value" :class="valueColor">
          {{ ahr999Display }}
        </span>
        <span class="text-gray-500 text-sm mb-1">/ 1.2 = 定投區上限</span>
      </div>
    </div>

    <!-- Progress -->
    <ProgressBar
      :value="ahr999Raw ?? 0"
      :min="0"
      :max="3"
      :show-labels="true"
      min-label="0 抄底"
      max-label="3+ 高風險"
    />

    <!-- Zones -->
    <div class="mt-4 grid grid-cols-3 gap-1.5 text-center">
      <div class="p-1.5 rounded-lg" :class="ahr999Raw && ahr999Raw < 0.45 ? 'bg-[#00d68f]/20 ring-1 ring-[#00d68f]/50' : 'bg-[#1e1e2e]'">
        <div class="text-[10px] text-[#00d68f] font-semibold">抄底區</div>
        <div class="text-[10px] text-gray-500">&lt; 0.45</div>
      </div>
      <div class="p-1.5 rounded-lg" :class="ahr999Raw && ahr999Raw >= 0.45 && ahr999Raw < 1.2 ? 'bg-[#ffb700]/20 ring-1 ring-[#ffb700]/50' : 'bg-[#1e1e2e]'">
        <div class="text-[10px] text-[#ffb700] font-semibold">定投區</div>
        <div class="text-[10px] text-gray-500">0.45 – 1.2</div>
      </div>
      <div class="p-1.5 rounded-lg" :class="ahr999Raw && ahr999Raw >= 1.2 ? 'bg-[#ff4757]/20 ring-1 ring-[#ff4757]/50' : 'bg-[#1e1e2e]'">
        <div class="text-[10px] text-[#ff4757] font-semibold">偏貴區</div>
        <div class="text-[10px] text-gray-500">&gt; 1.2</div>
      </div>
    </div>

    <!-- Description -->
    <p class="mt-3 text-xs text-gray-500 leading-relaxed">{{ signal.description }}</p>
  </div>
</template>

<script setup lang="ts">
import { useBtcStore } from '~/stores/btc'
import { getAHR999Signal } from '~/utils/signals'

const store = useBtcStore()

const ahr999Raw = computed(() => store.ahr999)

const signal = computed(() => getAHR999Signal(store.ahr999))

const ahr999Display = computed(() => {
  if (ahr999Raw.value === null) return '—'
  return ahr999Raw.value.toFixed(3)
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
