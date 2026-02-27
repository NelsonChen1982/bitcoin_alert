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
 * Rainbow Chart: Halving Price Regression (matching Bitbo / @ChartsBtc)
 *
 * Each band is the HPR regression line TIME-SHIFTED by multiples of 365 days:
 *   log10(price_i) = 2.6521 × ln(D + c_base + i × step) − 18.163
 *
 * Where:
 *   D = days from 2009-01-09 + 1 (Bitbo reference epoch)
 *   c_base = −182.5  (Low band shift)
 *   step = 228.125   (= 5 × 365 / 8, maps 6 Bitbo bands → our 9 bands)
 *
 * Bitbo uses 6 bands (Low → Red) each shifted by 365 days.
 * We use 9 bands covering the same range for finer granularity.
 *
 * Verified against Bitbo Plotly data (std dev of c ≤ 0.2 per band).
 */
export function getRainbowBands(daysFromGenesis: number): number[] {
  const A = 2.6521
  const B = -18.163
  // Bitbo epoch: 2009-01-09 (6 days after genesis), D starts at 1
  const D = daysFromGenesis - 5
  const cBase = -182.5       // Low band time shift
  const step  = 228.125      // 1825 / 8 — 9 bands spanning same range as Bitbo's 6

  return Array.from({ length: 9 }, (_, i) => {
    const shift = D + cBase + i * step
    if (shift <= 0) return NaN  // Too early for this band
    return Math.pow(10, A * Math.log(shift) + B)
  })
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
