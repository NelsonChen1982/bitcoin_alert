<template>
  <div class="card card-hover h-full">
    <div class="flex items-start justify-between mb-4">
      <div>
        <div class="section-title">恐懼貪婪指數</div>
        <div class="section-desc">市場情緒量化</div>
      </div>
      <SignalBadge :signal="signal" />
    </div>

    <!-- Gauge -->
    <div class="flex flex-col items-center mb-4">
      <div class="relative w-44 h-22">
        <svg viewBox="0 0 180 100" class="w-full">
          <!-- Background arc (semicircle) -->
          <path
            d="M 10 90 A 80 80 0 0 1 170 90"
            fill="none"
            stroke="#2a2a3a"
            stroke-width="16"
            stroke-linecap="round"
          />
          <!-- Colored arc -->
          <path
            d="M 10 90 A 80 80 0 0 1 170 90"
            fill="none"
            :stroke="gaugeGradientId"
            stroke-width="16"
            stroke-linecap="round"
            :stroke-dasharray="gaugeDashArray"
            :stroke-dashoffset="gaugeDashOffset"
          />
          <!-- Defs for gradient -->
          <defs>
            <linearGradient id="feargreed-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#00d68f"/>
              <stop offset="25%" stop-color="#40e0a0"/>
              <stop offset="50%" stop-color="#ffb700"/>
              <stop offset="75%" stop-color="#ff7f00"/>
              <stop offset="100%" stop-color="#ff4757"/>
            </linearGradient>
          </defs>
          <!-- Needle -->
          <g :transform="`rotate(${needleAngle}, 90, 90)`">
            <line x1="90" y1="90" x2="90" y2="20" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="90" cy="90" r="5" fill="white"/>
          </g>
          <!-- Value text -->
          <text x="90" y="80" text-anchor="middle" class="fill-white" font-size="22" font-weight="700" font-family="Roboto Mono, monospace">
            {{ store.fearGreedValue ?? '—' }}
          </text>
          <text x="90" y="97" text-anchor="middle" class="fill-gray-400" font-size="9" font-family="Inter, sans-serif">
            {{ valueText }}
          </text>
        </svg>
      </div>
    </div>

    <!-- Mini trend -->
    <div v-if="store.fearGreedHistory.length > 1" class="mb-3">
      <div class="text-xs text-gray-500 mb-1.5">近 7 日趨勢</div>
      <div class="flex items-end gap-1 h-8">
        <div
          v-for="(item, i) in last7"
          :key="i"
          class="flex-1 rounded-sm transition-all"
          :style="{
            height: `${(item.value / 100) * 32}px`,
            backgroundColor: getBarColor(item.value),
            opacity: i === last7.length - 1 ? 1 : 0.5
          }"
          :title="`${item.value}`"
        />
      </div>
    </div>

    <!-- Labels -->
    <div class="grid grid-cols-5 gap-1 text-center">
      <div class="text-[10px]">
        <div class="text-[#00d68f]">●</div>
        <div class="text-gray-500">極恐</div>
        <div class="text-gray-600">0–20</div>
      </div>
      <div class="text-[10px]">
        <div class="text-[#40d890]">●</div>
        <div class="text-gray-500">恐懼</div>
        <div class="text-gray-600">21–40</div>
      </div>
      <div class="text-[10px]">
        <div class="text-[#ffb700]">●</div>
        <div class="text-gray-500">中性</div>
        <div class="text-gray-600">41–60</div>
      </div>
      <div class="text-[10px]">
        <div class="text-[#ff7f00]">●</div>
        <div class="text-gray-500">貪婪</div>
        <div class="text-gray-600">61–80</div>
      </div>
      <div class="text-[10px]">
        <div class="text-[#ff4757]">●</div>
        <div class="text-gray-500">極貪</div>
        <div class="text-gray-600">81–100</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBtcStore } from '~/stores/btc'
import { getFearGreedSignal } from '~/utils/signals'

const store = useBtcStore()
const signal = computed(() => getFearGreedSignal(store.fearGreedValue))

// SVG arc calculations
const ARC_LENGTH = 251.2 // Circumference of half-circle (pi * 80)

const gaugeDashArray = ARC_LENGTH
const gaugeDashOffset = computed(() => {
  const v = store.fearGreedValue ?? 0
  return ARC_LENGTH - (v / 100) * ARC_LENGTH
})
const gaugeGradientId = 'url(#feargreed-gradient)'

// Needle: 0 = -90deg (left), 100 = +90deg (right)
const needleAngle = computed(() => {
  const v = store.fearGreedValue ?? 50
  return -90 + (v / 100) * 180
})

const valueText = computed(() => {
  const v = store.fearGreedValue
  if (v === null) return '載入中'
  if (v <= 20) return '極度恐懼'
  if (v <= 40) return '恐懼'
  if (v <= 60) return '中性'
  if (v <= 80) return '貪婪'
  return '極度貪婪'
})

const last7 = computed(() => store.fearGreedHistory.slice(0, 7).reverse())

function getBarColor(v: number): string {
  if (v <= 25) return '#00d68f'
  if (v <= 50) return '#ffb700'
  if (v <= 75) return '#ff7f00'
  return '#ff4757'
}
</script>
