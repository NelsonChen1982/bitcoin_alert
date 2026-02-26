import { defineStore } from 'pinia'
import type { PricePoint, FearGreedData, HalvingData } from '~/types/indicators'
import { calculate200WeekMA, calculateAHR999, calculateZScore, getHalvingInfo } from '~/utils/calculations'
import {
  getAHR999Signal, getMVRVSignal, getMA200WSignal,
  getFearGreedSignal, getNUPLSignal, getZScoreSignal
} from '~/utils/signals'

export const useBtcStore = defineStore('btc', {
  state: () => ({
    currentPrice:     null as number | null,
    priceLoading:     true,
    priceError:       null as string | null,
    lastPriceUpdate:  null as Date | null,

    weeklyHistory:    [] as PricePoint[],
    dailyHistory:     [] as PricePoint[],
    historyLoading:   true,
    historyLoaded:    false,

    fearGreedValue:   null as number | null,
    fearGreedHistory: [] as FearGreedData[],
    fearGreedLoading: true,

    mvrvValue:        null as number | null,
    nuplValue:        null as number | null,
    onChainLoading:   true,

    halvingData:      null as HalvingData | null,
    halvingLoading:   true,

    lastFullUpdate:   null as Date | null,
  }),

  getters: {
    ma200Week: (state): number | null => calculate200WeekMA(state.weeklyHistory),

    ahr999: (state): number | null => {
      if (!state.currentPrice || state.dailyHistory.length === 0) return null
      return calculateAHR999(state.currentPrice, state.dailyHistory)
    },

    zScore: (state): number | null => {
      if (!state.currentPrice || state.weeklyHistory.length === 0) return null
      return calculateZScore(state.currentPrice, state.weeklyHistory)
    },

    ahr999Signal() { return getAHR999Signal((this as any).ahr999) },
    mvrvSignal:      (state) => getMVRVSignal(state.mvrvValue),
    ma200wSignal()  { return getMA200WSignal((this as any).currentPrice, (this as any).ma200Week) },
    fearGreedSignal: (state) => getFearGreedSignal(state.fearGreedValue),
    nuplSignal:      (state) => getNUPLSignal(state.nuplValue),
    zScoreSignal()  { return getZScoreSignal((this as any).zScore) },

    isLoading: (state) => state.priceLoading || state.historyLoading,
  },

  actions: {
    // ── Price via server proxy (no CORS, multiple fallbacks) ─────────────────
    async fetchCurrentPrice() {
      try {
        this.priceLoading = true
        const data = await $fetch<{ price: number }>('/api/price')
        this.currentPrice    = data.price
        this.lastPriceUpdate = new Date()
        this.priceError      = null
      } catch (err) {
        console.error('Price fetch error:', err)
        this.priceError = '無法獲取價格'
      } finally {
        this.priceLoading = false
      }
    },

    // ── History via server proxy — no interval param (free tier compatible) ──
    async fetchPriceHistory() {
      try {
        this.historyLoading = true

        // "days=max" → CoinGecko auto-returns weekly granularity for full history
        const maxData = await $fetch<any>('/api/coingecko/history?days=max')
        if (maxData?.prices?.length) {
          this.weeklyHistory = (maxData.prices as [number, number][]).map(([ts, price]) => ({
            timestamp: ts,
            price,
          }))
        }

        // Separate daily fetch for AHR999 (needs ~200 daily points)
        const dailyData = await $fetch<any>('/api/coingecko/history?days=365')
        if (dailyData?.prices?.length) {
          this.dailyHistory = (dailyData.prices as [number, number][]).map(([ts, price]) => ({
            timestamp: ts,
            price,
          }))
        }

        this.historyLoaded = true
      } catch (err) {
        console.error('History fetch error:', err)
      } finally {
        this.historyLoading = false
      }
    },

    // ── Fear & Greed via server proxy ─────────────────────────────────────────
    async fetchFearGreed() {
      try {
        this.fearGreedLoading = true
        const data = await $fetch<any>('/api/feargreed')
        if (data?.data) {
          this.fearGreedValue   = parseInt(data.data[0].value)
          this.fearGreedHistory = data.data.map((d: any) => ({
            value:     parseInt(d.value),
            valueText: d.value_classification,
            timestamp: parseInt(d.timestamp) * 1000,
          }))
        }
      } catch (err) {
        console.error('Fear & Greed fetch error:', err)
      } finally {
        this.fearGreedLoading = false
      }
    },

    // ── On-chain via CoinMetrics (server proxy, no CORS) ─────────────────────
    async fetchOnChainData() {
      try {
        this.onChainLoading = true
        const data = await $fetch<{
          mvrv: number | null
          nupl: number | null
          source: string
        }>('/api/onchain/metrics')

        this.mvrvValue = data.mvrv
        this.nuplValue = data.nupl

        // If API returned nulls, fall back to approximation
        if (this.mvrvValue === null) this._approximateMVRV()
        if (this.nuplValue === null) this._approximateNUPL()
      } catch (err) {
        console.error('On-chain data error:', err)
        this._approximateMVRV()
        this._approximateNUPL()
      } finally {
        this.onChainLoading = false
      }
    },

    _approximateMVRV() {
      if (!this.currentPrice || this.dailyHistory.length < 90) return
      const window = Math.min(180, this.dailyHistory.length)
      const avg = this.dailyHistory.slice(-window).reduce((s, p) => s + p.price, 0) / window
      if (avg > 0) {
        this.mvrvValue = parseFloat((this.currentPrice / avg).toFixed(3))
      }
    },

    _approximateNUPL() {
      // NUPL ≈ (MVRV - 1) / MVRV
      if (this.mvrvValue !== null && this.mvrvValue > 0) {
        this.nuplValue = parseFloat(((this.mvrvValue - 1) / this.mvrvValue).toFixed(3))
      }
    },

    // ── Halving via server proxy ──────────────────────────────────────────────
    async fetchHalving() {
      try {
        this.halvingLoading = true
        const data = await $fetch<{ blockHeight: number }>('/api/halving')
        this.halvingData = getHalvingInfo(data.blockHeight)
      } catch (err) {
        console.error('Halving fetch error:', err)
        this.halvingData = getHalvingInfo(885000)
      } finally {
        this.halvingLoading = false
      }
    },

    // ── Full refresh ──────────────────────────────────────────────────────────
    async refreshAll() {
      // Start price, fg, halving in parallel
      const parallel = Promise.allSettled([
        this.fetchCurrentPrice(),
        this.fetchFearGreed(),
        this.fetchHalving(),
      ])

      // History only on first load
      if (!this.historyLoaded) {
        await this.fetchPriceHistory()
      }

      await parallel
      await this.fetchOnChainData()   // needs currentPrice for approximation
      this.lastFullUpdate = new Date()
    },
  },
})
