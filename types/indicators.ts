export type SignalLevel = 'green' | 'yellow' | 'orange' | 'red' | 'gray'

export interface Signal {
  level: SignalLevel
  label: string
  description: string
}

export interface IndicatorData {
  value: number | null
  signal: Signal
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export interface PricePoint {
  timestamp: number
  price: number
}

export interface BtcState {
  currentPrice: number | null
  priceLoading: boolean
  priceHistory: PricePoint[]
  weeklyHistory: PricePoint[]
  dailyHistory: PricePoint[]
  lastPriceUpdate: Date | null
}

export interface FearGreedData {
  value: number
  valueText: string
  timestamp: number
}

export interface HalvingData {
  currentBlock: number
  nextHalvingBlock: number
  blocksRemaining: number
  estimatedDate: Date
  currentReward: number
  nextReward: number
  daysRemaining: number
  hoursRemaining: number
  minutesRemaining: number
}

export interface RainbowBand {
  label: string
  description: string
  color: string
  multiplier: number
}
