<template>
  <div class="min-h-screen bg-[#0f0f14]">
    <Header :refreshing="refreshing" @refresh="handleRefresh" />

    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      <!-- Hero summary banner -->
      <div class="card" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a24 100%)">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-lg font-bold text-white mb-1">何時該抄底 BTC，就看這裡</h1>
            <p class="text-sm text-gray-400 max-w-lg">
              透過鏈上估值指標找「風險相對低的位置」，不追漲殺跌，讓數據說話。
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <div v-for="item in summaryItems" :key="item.label"
              class="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1e2e] rounded-full"
            >
              <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: item.color }" />
              <span class="text-xs text-gray-400">{{ item.label }}</span>
              <span class="text-xs font-mono text-white">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 6 Indicator Cards Grid -->
      <div>
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
          六大鏈上估值指標
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AHR999Card />
          <MVRVCard />
          <MA200WCard />
          <FearGreedCard />
          <NUPLCard />
          <ZScoreCard />
        </div>
      </div>

      <!-- Halving Countdown -->
      <div>
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
          減半倒數計時
        </h2>
        <HalvingCountdown />
      </div>

      <!-- Rainbow Chart -->
      <div>
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
          彩虹圖
        </h2>
        <RainbowChart />
      </div>

      <!-- Footer info -->
      <div class="text-center py-4">
        <p class="text-xs text-gray-600">
          資料來源：CoinGecko · Alternative.me · Blockchain.info · Coinglass
          <span class="mx-2">·</span>
          本工具僅供參考，不構成投資建議
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useBtcStore } from '~/stores/btc'
import { formatPrice } from '~/utils/calculations'

const store = useBtcStore()
const refreshing = ref(false)

// Initial data load
onMounted(async () => {
  await store.refreshAll()

  // Auto-refresh price every 60s
  const priceInterval = setInterval(() => store.fetchCurrentPrice(), 60_000)
  // Auto-refresh fear & greed every hour
  const fgInterval = setInterval(() => store.fetchFearGreed(), 60 * 60_000)
  // Auto-refresh history every 4 hours
  const historyInterval = setInterval(() => store.fetchPriceHistory(), 4 * 60 * 60_000)
  // Auto-refresh halving every 10 minutes
  const halvingInterval = setInterval(() => store.fetchHalving(), 10 * 60_000)
  // Auto-refresh on-chain every 4 hours
  const onchainInterval = setInterval(() => store.fetchOnChainData(), 4 * 60 * 60_000)

  onUnmounted(() => {
    clearInterval(priceInterval)
    clearInterval(fgInterval)
    clearInterval(historyInterval)
    clearInterval(halvingInterval)
    clearInterval(onchainInterval)
  })
})

async function handleRefresh() {
  refreshing.value = true
  await store.refreshAll()
  refreshing.value = false
}

// Summary bar values
const summaryItems = computed(() => [
  {
    label: 'AHR999',
    value: store.ahr999 !== null ? (store.ahr999 / 100).toFixed(2) : '—',
    color: getSignalColor(store.ahr999Signal?.level),
  },
  {
    label: 'MVRV',
    value: store.mvrvValue !== null ? store.mvrvValue.toFixed(2) + 'x' : '—',
    color: getSignalColor(store.mvrvSignal?.level),
  },
  {
    label: '恐懼貪婪',
    value: store.fearGreedValue !== null ? store.fearGreedValue.toString() : '—',
    color: getSignalColor(store.fearGreedSignal?.level),
  },
  {
    label: 'Z-Score',
    value: store.zScore !== null ? store.zScore.toFixed(1) : '—',
    color: getSignalColor(store.zScoreSignal?.level),
  },
])

function getSignalColor(level?: string): string {
  if (level === 'green') return '#00d68f'
  if (level === 'yellow') return '#ffb700'
  if (level === 'orange') return '#ff7f00'
  if (level === 'red') return '#ff4757'
  return '#6b7280'
}

useHead({
  title: 'BTC Bottom Finder — 何時該抄底就看這裡',
})
</script>
