<template>
  <header class="sticky top-0 z-50 border-b border-[#2a2a3a] bg-[#0f0f14]/90 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
      <!-- Logo -->
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background: linear-gradient(135deg, #f7931a, #ffb700)">
          <span class="text-sm font-bold text-black">₿</span>
        </div>
        <div>
          <span class="font-bold text-white text-sm tracking-tight">BTC Bottom Finder</span>
          <span class="hidden sm:inline text-xs text-gray-500 ml-2">何時該抄底，就看這裡</span>
        </div>
      </div>

      <!-- Price + status -->
      <div class="flex items-center gap-3 sm:gap-5">
        <!-- Overall signal -->
        <div class="hidden sm:flex items-center gap-1.5">
          <span class="text-xs text-gray-500">整體訊號</span>
          <SignalBadge :signal="overallSignal" />
        </div>

        <!-- BTC Price -->
        <div class="flex items-center gap-2 bg-[#1a1a24] rounded-xl px-3 py-1.5">
          <span class="text-[#f7931a] text-sm font-bold">BTC</span>
          <div v-if="store.priceLoading" class="shimmer h-5 w-20 rounded" />
          <span v-else class="font-mono text-sm font-semibold text-white">
            {{ formatPrice(store.currentPrice) }}
          </span>
        </div>

        <!-- Last updated -->
        <div class="hidden sm:flex items-center gap-1.5">
          <div class="w-1.5 h-1.5 rounded-full bg-[#00d68f] animate-pulse" />
          <span class="text-xs text-gray-500">
            {{ lastUpdateText }}
          </span>
        </div>

        <!-- Refresh button -->
        <button
          @click="emit('refresh')"
          class="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-[#2a2a3a] transition-colors"
          :class="{ 'animate-spin-slow': refreshing }"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useBtcStore } from '~/stores/btc'
import { getOverallRisk, makeSignal } from '~/utils/signals'
import { formatPrice } from '~/utils/calculations'

const props = defineProps<{ refreshing?: boolean }>()
const emit = defineEmits(['refresh'])

const store = useBtcStore()

const overallSignal = computed(() => {
  const levels = [
    store.ahr999Signal?.level,
    store.mvrvSignal?.level,
    store.ma200wSignal?.level,
    store.fearGreedSignal?.level,
    store.nuplSignal?.level,
    store.zScoreSignal?.level,
  ]
  const overall = getOverallRisk(levels.filter(Boolean) as any)
  const labels: Record<string, string> = {
    green: '買入區間',
    yellow: '謹慎觀察',
    orange: '偏熱謹慎',
    red: '高風險',
    gray: '載入中',
  }
  const descs: Record<string, string> = {
    green: '多數指標顯示低風險',
    yellow: '市場中性，保持觀察',
    orange: '市場偏熱，謹慎操作',
    red: '多數指標顯示高估，注意風險',
    gray: '資料載入中',
  }
  return makeSignal(overall as any, labels[overall] ?? '觀察', descs[overall] ?? '')
})

const lastUpdateText = computed(() => {
  if (!store.lastPriceUpdate) return '等待資料...'
  const seconds = Math.floor((Date.now() - store.lastPriceUpdate.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s 前更新`
  return `${Math.floor(seconds / 60)}m 前更新`
})
</script>
