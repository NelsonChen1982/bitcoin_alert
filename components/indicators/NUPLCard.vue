<template>
  <div class="card card-hover h-full">
    <div class="flex items-start justify-between mb-4">
      <div>
        <div class="section-title">NUPL</div>
        <div class="section-desc">Net Unrealized Profit / Loss</div>
      </div>
      <SignalBadge :signal="signal" />
    </div>

    <div class="mb-5">
      <div v-if="store.onChainLoading" class="shimmer h-10 w-28 rounded-lg" />
      <div v-else class="flex items-end gap-2">
        <span class="metric-value" :class="valueColor">
          {{ nuplDisplay }}
        </span>
      </div>
    </div>

    <!-- Stages visualization -->
    <div class="space-y-2 mb-4">
      <div
        v-for="stage in stages"
        :key="stage.label"
        class="flex items-center gap-3 px-3 py-2 rounded-lg transition-all"
        :class="isActive(stage) ? stage.activeBg : 'bg-[#1e1e2e] opacity-60'"
      >
        <div class="flex-shrink-0 w-2 h-2 rounded-full" :style="{ backgroundColor: stage.color }" />
        <div class="flex-1 min-w-0">
          <div class="text-xs font-medium text-gray-200">{{ stage.label }}</div>
          <div class="text-[10px] text-gray-500">{{ stage.desc }}</div>
        </div>
        <div class="text-xs text-gray-500 flex-shrink-0">{{ stage.range }}</div>
      </div>
    </div>

    <p class="text-xs text-gray-500 leading-relaxed">{{ signal.description }}</p>
  </div>
</template>

<script setup lang="ts">
import { useBtcStore } from '~/stores/btc'
import { getNUPLSignal } from '~/utils/signals'

const store = useBtcStore()
const signal = computed(() => getNUPLSignal(store.nuplValue))

const nuplDisplay = computed(() => {
  if (store.nuplValue === null) return '—'
  return store.nuplValue.toFixed(3)
})

const valueColor = computed(() => {
  const level = signal.value.level
  if (level === 'green') return 'text-[#00d68f]'
  if (level === 'yellow') return 'text-[#ffb700]'
  if (level === 'orange') return 'text-[#ff7f00]'
  if (level === 'red') return 'text-[#ff4757]'
  return 'text-white'
})

const stages = [
  { label: '投降（Capitulation）', desc: '大多持有者虧損，歷史底部', range: '< 0', min: -1, max: 0, color: '#00d68f', activeBg: 'bg-[#00d68f]/15 ring-1 ring-[#00d68f]/40 opacity-100' },
  { label: '希望 / 恐懼', desc: '市場從底部緩慢回升', range: '0 – 0.25', min: 0, max: 0.25, color: '#40d890', activeBg: 'bg-[#40d890]/15 ring-1 ring-[#40d890]/40 opacity-100' },
  { label: '樂觀', desc: '多數人開始盈利，健康牛市', range: '0.25 – 0.5', min: 0.25, max: 0.5, color: '#ffb700', activeBg: 'bg-[#ffb700]/15 ring-1 ring-[#ffb700]/40 opacity-100' },
  { label: '信念 / 否認', desc: '大幅盈利，市場過熱信號', range: '0.5 – 0.75', min: 0.5, max: 0.75, color: '#ff7f00', activeBg: 'bg-[#ff7f00]/15 ring-1 ring-[#ff7f00]/40 opacity-100' },
  { label: '狂熱（Euphoria）', desc: '接近週期頂部，強烈獲利訊號', range: '> 0.75', min: 0.75, max: 1, color: '#ff4757', activeBg: 'bg-[#ff4757]/15 ring-1 ring-[#ff4757]/40 opacity-100' },
]

function isActive(stage: typeof stages[0]) {
  const v = store.nuplValue
  if (v === null) return false
  return v >= stage.min && v < stage.max
}
</script>
