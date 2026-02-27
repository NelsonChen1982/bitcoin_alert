import type { PricePoint, Signal } from '~/types/indicators'

// Genesis block timestamp (2009-01-03)
const GENESIS_TIMESTAMP = new Date('2009-01-03').getTime()
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000

/**
 * AHR999 指數 = (price / 200日均線) × (price / 冪律增長估值)
 *
 * Standard formula (Nine God / ahr999):
 *   ahr999 = (P / MA200) × (P / V)
 *   where V = 10^(5.84 × log10(days_since_genesis) − 17.01)
 *
 * V is the Bitcoin power-law regression model (same as rainbow chart midline).
 *
 * Thresholds:
 *   < 0.45  → 抄底區 (strong buy, historically ~8.5% of time)
 *   0.45–1.2 → 定投區 (DCA zone, ~46% of time)
 *   > 1.2   → 等待 / 偏貴
 */
export function calculateAHR999(currentPrice: number, dailyPrices: PricePoint[]): number | null {
  if (!currentPrice || dailyPrices.length < 200) return null

  // Calculate 200-day simple moving average
  const last200 = dailyPrices.slice(-200)
  const ma200 = last200.reduce((sum, p) => sum + p.price, 0) / last200.length

  // Days since genesis
  const daysFromGenesis = (Date.now() - GENESIS_TIMESTAMP) / (1000 * 60 * 60 * 24)

  // Power-law growth estimate: V = 10^(5.84 × log10(days) − 17.01)
  const growthEstimate = Math.pow(10, 5.84 * Math.log10(daysFromGenesis) - 17.01)

  // AHR999 = (price / MA200) × (price / growthEstimate)
  return (currentPrice / ma200) * (currentPrice / growthEstimate)
}

/**
 * 200-Week Moving Average
 */
export function calculate200WeekMA(weeklyPrices: PricePoint[]): number | null {
  if (weeklyPrices.length < 200) return null
  const last200Weeks = weeklyPrices.slice(-200)
  return last200Weeks.reduce((sum, p) => sum + p.price, 0) / last200Weeks.length
}

/**
 * Z-Score = (price - 200wMA) / stdDev(200w prices)
 */
export function calculateZScore(currentPrice: number, weeklyPrices: PricePoint[]): number | null {
  if (!currentPrice || weeklyPrices.length < 200) return null

  const last200Weeks = weeklyPrices.slice(-200)
  const ma = last200Weeks.reduce((sum, p) => sum + p.price, 0) / last200Weeks.length

  const variance = last200Weeks.reduce((sum, p) => sum + Math.pow(p.price - ma, 2), 0) / last200Weeks.length
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) return 0
  return (currentPrice - ma) / stdDev
}

/**
 * Rainbow Chart: Power-law logarithmic regression
 *
 * Formula: log10(price) = a × log10(days_since_genesis) + b
 * Equivalent: price = 10 ^ (a × log10(days) + b)
 *
 * Coefficients (community standard, Dave the Wave / lookintobitcoin):
 *   a =  5.84509   ← POSITIVE (price grows with time)
 *   b = -17.01593
 *
 * Verification (today, ~6264 days since genesis):
 *   log10(6264) = 3.797
 *   5.84509 × 3.797 − 17.016 = 5.17  →  10^5.17 ≈ $148k  (regression midpoint)
 */
export function getRainbowBands(daysFromGenesis: number): number[] {
  const a =  5.84509
  const b = -17.01593
  const base = a * Math.log10(daysFromGenesis) + b   // log10, NOT ln

  // 9 offsets calibrated to full Bitcoin history (2013–present), matching Bitbo's visual:
  //   Bottom: COVID crash 2020 = -0.49, 2022 bear = -0.44
  //   Top:    2013 Nov bubble = +1.09, 2017 peak = +0.79
  // Range: -0.75 → +1.18 contains ALL historical price action including 2013 extreme
  const offsets = [-0.75, -0.50, -0.26, -0.02, 0.22, 0.46, 0.70, 0.94, 1.18]
  return offsets.map(offset => Math.pow(10, base + offset))
}

/**
 * Determine which rainbow band the current price is in
 */
export function getRainbowBandIndex(currentPrice: number, daysFromGenesis: number): number {
  const bands = getRainbowBands(daysFromGenesis)
  for (let i = 0; i < bands.length - 1; i++) {
    if (currentPrice <= bands[i + 1]) return i
  }
  return bands.length - 1
}

/**
 * Format large numbers with commas and appropriate suffix
 */
export function formatPrice(price: number): string {
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`
  if (price >= 1_000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  return `$${price.toFixed(2)}`
}

export function formatNumber(n: number, decimals = 2): string {
  return n.toFixed(decimals)
}

/**
 * Halving block schedule
 */
export function getHalvingInfo(currentBlock: number) {
  const BLOCKS_PER_HALVING = 210_000
  const halvingNumber = Math.floor(currentBlock / BLOCKS_PER_HALVING)
  const nextHalvingBlock = (halvingNumber + 1) * BLOCKS_PER_HALVING
  const blocksRemaining = nextHalvingBlock - currentBlock

  // Estimate ~10 minutes per block
  const minutesRemaining = blocksRemaining * 10
  const msRemaining = minutesRemaining * 60 * 1000
  const estimatedDate = new Date(Date.now() + msRemaining)

  const currentReward = 50 / Math.pow(2, halvingNumber)
  const nextReward = currentReward / 2

  const totalMinutes = minutesRemaining
  const days = Math.floor(totalMinutes / 60 / 24)
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = Math.floor(totalMinutes % 60)

  return {
    currentBlock,
    nextHalvingBlock,
    blocksRemaining,
    estimatedDate,
    currentReward,
    nextReward,
    daysRemaining: days,
    hoursRemaining: hours,
    minutesRemaining: minutes,
  }
}
