<template>
  <div class="card">
    <div class="flex items-start justify-between mb-4">
      <div>
        <div class="section-title">🌈 比特幣彩虹圖</div>
        <div class="section-desc">對數回歸估值帶 — 你現在在哪一條彩虹上？</div>
      </div>
      <div v-if="currentBand" class="px-3 py-1.5 rounded-full text-xs font-semibold border"
        :style="{ color: currentBand.color, borderColor: currentBand.color + '50', backgroundColor: currentBand.color + '15' }"
      >
        {{ currentBand.description }}
      </div>
    </div>

    <!-- Chart -->
    <div ref="chartContainer" class="w-full" style="height: 380px;">
      <div v-if="!hasData" class="flex items-center justify-center h-full">
        <div class="text-center">
          <div class="shimmer w-full h-80 rounded-xl" />
        </div>
      </div>
      <canvas v-else ref="canvasRef" class="w-full h-full" />
    </div>

    <!-- Band legend -->
    <div class="mt-4 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
      <div
        v-for="(band, i) in bands"
        :key="i"
        class="text-center p-2 rounded-lg transition-all"
        :class="currentBandIndex === i ? 'ring-2 ring-white/30 bg-white/5' : ''"
      >
        <div class="w-4 h-4 rounded mx-auto mb-1" :style="{ backgroundColor: band.color }" />
        <div class="text-[9px] leading-tight" :style="{ color: band.color }">{{ band.description }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBtcStore } from '~/stores/btc'
import { getRainbowBands, getRainbowBandIndex } from '~/utils/calculations'

const store = useBtcStore()
const canvasRef = ref<HTMLCanvasElement>()
let chartInstance: any = null

const GENESIS = new Date('2009-01-03').getTime()

const bands = [
  { description: '一生一次的機會', color: '#1a6fd4' },
  { description: '廉價，快買', color: '#3b9de3' },
  { description: '買！', color: '#41c89e' },
  { description: '繼續 HODL', color: '#53d67d' },
  { description: '賣一點', color: '#e8d84a' },
  { description: 'FOMO 要來了', color: '#f5a623' },
  { description: '快賣掉', color: '#e8693e' },
  { description: '不要太貪心', color: '#d93d2b' },
  { description: '最高點附近', color: '#9b1a1a' },
]

const hasData = computed(() => store.weeklyHistory.length > 100 && store.currentPrice)

const currentBandIndex = computed(() => {
  if (!store.currentPrice || !hasData.value) return -1
  const daysFromGenesis = (Date.now() - GENESIS) / (1000 * 60 * 60 * 24)
  return getRainbowBandIndex(store.currentPrice, daysFromGenesis)
})

const currentBand = computed(() => {
  if (currentBandIndex.value < 0) return null
  return bands[currentBandIndex.value]
})

function buildChartData() {
  if (!store.weeklyHistory.length) return null

  const labels: string[] = []
  const priceData: (number | null)[] = []
  const bandDatasets: { data: number[]; color: string; label: string }[] = bands.map((b, i) => ({
    data: [],
    color: b.color,
    label: b.description,
  }))

  // Calculate band values for each week
  store.weeklyHistory.forEach((point) => {
    const date = new Date(point.timestamp)
    labels.push(date.toISOString().split('T')[0])
    priceData.push(point.price)

    const daysFromGenesis = (point.timestamp - GENESIS) / (1000 * 60 * 60 * 24)
    if (daysFromGenesis <= 0) {
      bandDatasets.forEach(bd => bd.data.push(NaN))
      return
    }
    const bandValues = getRainbowBands(daysFromGenesis)
    bandDatasets.forEach((bd, i) => {
      bd.data.push(bandValues[i] > 0 ? bandValues[i] : NaN)
    })
  })

  return { labels, priceData, bandDatasets }
}

async function renderChart() {
  if (!canvasRef.value || !hasData.value) return

  // Dynamically import Chart.js to avoid SSR issues
  const { Chart, registerables } = await import('chart.js')
  Chart.register(...registerables)

  const chartData = buildChartData()
  if (!chartData) return

  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  const { labels, priceData, bandDatasets } = chartData

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        // Rainbow bands (filled areas between consecutive bands)
        ...bandDatasets.map((bd, i) => ({
          label: bd.label,
          data: bd.data,
          borderColor: bd.color,
          backgroundColor: bd.color + '30',
          borderWidth: 0.5,
          fill: i > 0 ? `-1` : false,
          pointRadius: 0,
          tension: 0.3,
        })),
        // Price line
        {
          label: 'BTC 價格',
          data: priceData,
          borderColor: '#ffffff',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
          z: 10,
        } as any,
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          filter: (item) => item.datasetIndex === bandDatasets.length, // Only show price tooltip
          callbacks: {
            label: (ctx) => `BTC: $${Math.round(ctx.raw as number).toLocaleString()}`,
          },
          backgroundColor: '#1a1a24',
          borderColor: '#3a3a4e',
          borderWidth: 1,
          titleColor: '#9ca3af',
          bodyColor: '#ffffff',
        },
      },
      scales: {
        x: {
          type: 'category',
          ticks: {
            color: '#6b7280',
            maxTicksLimit: 8,
            font: { size: 10 },
          },
          grid: { color: '#2a2a3a40' },
          border: { color: '#2a2a3a' },
        },
        y: {
          type: 'logarithmic',
          ticks: {
            color: '#6b7280',
            font: { size: 10 },
            callback: (value) => {
              const v = Number(value)
              if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`
              return `$${v}`
            },
          },
          grid: { color: '#2a2a3a40' },
          border: { color: '#2a2a3a' },
        },
      },
    },
  })
}

watch(hasData, (val) => {
  if (val) nextTick(renderChart)
})

onMounted(() => {
  if (hasData.value) nextTick(renderChart)
})

onUnmounted(() => {
  chartInstance?.destroy()
})
</script>
