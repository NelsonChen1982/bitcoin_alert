/**
 * Historical BTC price proxy.
 *
 * ?days=max  → weekly candles back to 2013, for 200-week MA + rainbow chart
 * ?days=365  → daily candles for AHR999 200-day MA
 *
 * Long-term source priority:
 *   1. BGeometrics daily (2013-01-01 to present) — deepest history
 *   2. Kraken weekly   (2013-10 to present, 648 pts)
 *   3. Binance weekly  (2017+ only)
 *
 * Short-term source priority:
 *   1. Binance daily   (2017+ only, sufficient for 200-day MA)
 *   2. Kraken daily
 *
 * Returns CoinGecko-compatible shape: { prices: [[timestamp_ms, closePrice], ...] }
 */
export default defineEventHandler(async (event) => {
  const query  = getQuery(event)
  const days   = String(query.days ?? 'max')
  const isLong = days === 'max' || parseInt(days) > 365
  const limit  = isLong ? 1000 : Math.min(parseInt(days) || 365, 1000)

  if (isLong) {
    // ── 1st: BGeometrics daily price (2013-01 → present) ─────────────────────
    // Downsample daily → weekly (every 7th point) for 200-week MA compatibility
    try {
      const raw = await $fetch<[number, number][]>(
        'https://charts.bgeometrics.com/files/nupl_btc_price.json',
        { timeout: 15000 }
      )
      if (raw?.length > 200) {
        // Sample every 7th day to approximate weekly candles
        const weekly = raw.filter((_, i) => i % 7 === 0)
        return { prices: weekly }
      }
    } catch { /* fall through */ }

    // ── 2nd: Kraken weekly (2013-10 → present, 648 candles) ──────────────────
    try {
      const kr = await $fetch<any>(
        'https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=10080',
        { timeout: 15000 }
      )
      const ohlc: any[][] = kr?.result?.XXBTZUSD ?? []
      if (ohlc.length > 100) {
        const prices = ohlc.map((c: any[]) => [
          Number(c[0]) * 1000,       // Unix seconds → ms
          parseFloat(String(c[4])),  // close price
        ])
        return { prices }
      }
    } catch { /* fall through */ }

    // ── 3rd: Binance weekly (2017+ fallback) ──────────────────────────────────
    try {
      const raw = await $fetch<any[][]>(
        `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1w&limit=${limit}`,
        { headers: { Accept: 'application/json' }, timeout: 15000 }
      )
      const prices = raw.map(c => [Number(c[0]), parseFloat(String(c[4]))])
      return { prices }
    } catch { /* fall through */ }

  } else {
    // ── Short-term daily: Binance first ──────────────────────────────────────
    try {
      const raw = await $fetch<any[][]>(
        `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=${limit}`,
        { headers: { Accept: 'application/json' }, timeout: 15000 }
      )
      const prices = raw.map(c => [Number(c[0]), parseFloat(String(c[4]))])
      return { prices }
    } catch { /* fall through */ }

    // ── Short-term fallback: Kraken daily ────────────────────────────────────
    try {
      const kr = await $fetch<any>(
        'https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=1440',
        { timeout: 12000 }
      )
      const ohlc: any[][] = kr?.result?.XXBTZUSD ?? []
      const prices = ohlc.slice(-limit).map((c: any[]) => [
        Number(c[0]) * 1000,
        parseFloat(String(c[4])),
      ])
      return { prices }
    } catch { /* fall through */ }
  }

  throw createError({ statusCode: 503, statusMessage: 'All price history sources unavailable' })
})
