/**
 * On-chain metrics proxy.
 * Source: CoinMetrics Community API (free, no auth required).
 *
 * IMPORTANT: This route NEVER throws — it always returns JSON.
 * That ensures CORS headers from the middleware are always present.
 */
export default defineEventHandler(async (_event) => {
  const FALLBACK = { mvrv: null, nupl: null, date: null, source: 'fallback' }
  const baseUrl  = 'https://community-api.coinmetrics.io/v4/timeseries/asset-metrics'

  // ── Attempt 1: MVRV + NUPL together ────────────────────────────────────────
  try {
    const params = new URLSearchParams({
      assets: 'btc',
      metrics: 'CapMVRVCur,NUPLCur',
      frequency: '1d',
      limit_per_asset: '1',
      sort: 'time',
      direction: 'desc',
    })
    const data    = await $fetch<any>(`${baseUrl}?${params}`, { timeout: 12000 })
    const latest  = data?.data?.[0]
    if (latest) {
      return {
        mvrv:   latest.CapMVRVCur != null ? parseFloat(latest.CapMVRVCur) : null,
        nupl:   latest.NUPLCur    != null ? parseFloat(latest.NUPLCur)    : null,
        date:   latest.time ?? null,
        source: 'coinmetrics',
      }
    }
  } catch { /* fall through */ }

  // ── Attempt 2: MVRV only (NUPLCur may not be in community tier) ────────────
  try {
    const params = new URLSearchParams({
      assets: 'btc',
      metrics: 'CapMVRVCur',
      frequency: '1d',
      limit_per_asset: '1',
      sort: 'time',
      direction: 'desc',
    })
    const data   = await $fetch<any>(`${baseUrl}?${params}`, { timeout: 10000 })
    const latest = data?.data?.[0]
    if (latest?.CapMVRVCur != null) {
      return {
        mvrv:   parseFloat(latest.CapMVRVCur),
        nupl:   null,   // approximated in store
        date:   latest.time ?? null,
        source: 'coinmetrics-mvrv-only',
      }
    }
  } catch { /* fall through */ }

  // ── Fallback: store will approximate from price history ────────────────────
  return FALLBACK
})
