/**
 * On-chain metrics proxy — MVRV + NUPL
 *
 * Sources (in priority order):
 *   1. CoinMetrics Community API (free, needs no key)
 *   2. BGeometrics static JSON files (free, no auth, updated daily)
 *   3. Fallback nulls — store will approximate from price history
 *
 * IMPORTANT: This route NEVER throws — it always returns JSON.
 * That ensures CORS headers from the middleware are always present.
 */
export default defineEventHandler(async (_event) => {
  const FALLBACK = { mvrv: null, nupl: null, date: null, source: 'fallback' }

  // ── Attempt 1: CoinMetrics Community API ──────────────────────────────────
  try {
    const baseUrl = 'https://community-api.coinmetrics.io/v4/timeseries/asset-metrics'
    const params = new URLSearchParams({
      assets: 'btc',
      metrics: 'CapMVRVCur,NUPLCur',
      frequency: '1d',
      limit_per_asset: '1',
      sort: 'time',
      direction: 'desc',
    })
    const data = await $fetch<any>(`${baseUrl}?${params}`, { timeout: 10000 })
    const latest = data?.data?.[0]
    if (latest) {
      const mvrv = latest.CapMVRVCur != null ? parseFloat(latest.CapMVRVCur) : null
      const nupl = latest.NUPLCur != null ? parseFloat(latest.NUPLCur) : null
      if (mvrv !== null) {
        return {
          mvrv,
          nupl,
          date: latest.time ?? null,
          source: 'coinmetrics',
        }
      }
    }
  } catch { /* fall through */ }

  // ── Attempt 2: BGeometrics static JSON (free, updated daily) ──────────────
  try {
    const bgBase = 'https://charts.bgeometrics.com/files'

    // Fetch realized price + NUPL in parallel
    const [realizedData, nuplData] = await Promise.all([
      $fetch<[number, number][]>(`${bgBase}/realized_price.json`, { timeout: 10000 }),
      $fetch<[number, number][]>(`${bgBase}/nupl_7dma.json`, { timeout: 10000 }),
    ])

    let mvrv: number | null = null
    let nupl: number | null = null
    let date: string | null = null

    // MVRV = current_price / realized_price
    if (realizedData?.length) {
      const lastRealized = realizedData[realizedData.length - 1]
      const realizedPrice = lastRealized[1]
      const realizedTs = lastRealized[0]
      date = new Date(realizedTs).toISOString().split('T')[0]

      // Fetch current BTC price to compute MVRV
      let currentPrice: number | null = null
      try {
        const priceResp = await $fetch<any>(
          'https://api.coinbase.com/v2/prices/BTC-USD/spot',
          { timeout: 5000 }
        )
        currentPrice = parseFloat(priceResp?.data?.amount)
      } catch {
        try {
          const priceResp = await $fetch<any>(
            'https://api.kraken.com/0/public/Ticker?pair=XBTUSD',
            { timeout: 5000 }
          )
          currentPrice = parseFloat(priceResp?.result?.XXBTZUSD?.c?.[0])
        } catch { /* no price */ }
      }

      if (currentPrice && realizedPrice > 0) {
        mvrv = parseFloat((currentPrice / realizedPrice).toFixed(3))
      }
    }

    // NUPL from BGeometrics (7-day moving average, on-chain data)
    if (nuplData?.length) {
      nupl = parseFloat(nuplData[nuplData.length - 1][1].toFixed(4))
    }

    if (mvrv !== null || nupl !== null) {
      return { mvrv, nupl, date, source: 'bgeometrics' }
    }
  } catch { /* fall through */ }

  // ── Attempt 3: Fallback — store will approximate from price history ───────
  return FALLBACK
})
