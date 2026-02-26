/**
 * Historical BTC price proxy — Binance public API (free, no API key needed).
 * Fallback: Kraken OHLC (also free, no key).
 *
 * ?days=max  → weekly candles, up to 1000 (≈19 years), for 200-week MA
 * ?days=365  → daily candles, for AHR999 200-day MA
 *
 * Returns CoinGecko-compatible shape so the store needs no changes:
 *   { prices: [[timestamp_ms, closePrice], ...] }
 */
export default defineEventHandler(async (event) => {
  const query  = getQuery(event)
  const days   = String(query.days ?? 'max')
  const isLong = days === 'max' || parseInt(days) > 365
  const limit  = isLong ? 1000 : Math.min(parseInt(days) || 365, 1000)
  const interval = isLong ? '1w' : '1d'

  // ── Primary: Binance ────────────────────────────────────────────────────────
  try {
    const raw = await $fetch<any[][]>(
      `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`,
      { headers: { Accept: 'application/json' }, timeout: 15000 }
    )
    // Binance kline shape: [openTime, open, high, low, close, vol, closeTime, ...]
    const prices = raw.map(c => [Number(c[0]), parseFloat(String(c[4]))])
    return { prices }
  } catch { /* fall through */ }

  // ── Fallback: Kraken OHLC ───────────────────────────────────────────────────
  try {
    const krakenInterval = isLong ? 10080 : 1440  // minutes: 1w or 1d
    const kr = await $fetch<any>(
      `https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=${krakenInterval}`,
      { timeout: 12000 }
    )
    const ohlc: any[][] = kr?.result?.XXBTZUSD ?? []
    const prices = ohlc.slice(-limit).map((c: any[]) => [
      Number(c[0]) * 1000,        // Kraken: Unix seconds → ms
      parseFloat(String(c[4])),   // close price
    ])
    return { prices }
  } catch { /* fall through */ }

  throw createError({ statusCode: 503, statusMessage: 'All price history sources unavailable' })
})
