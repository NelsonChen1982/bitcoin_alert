export default defineEventHandler(async () => {
  // Primary: CoinGecko
  try {
    const data = await $fetch<any>(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      { timeout: 8000 }
    )
    return { price: data.bitcoin.usd, source: 'coingecko' }
  } catch {}

  // Fallback 1: Coinbase
  try {
    const data = await $fetch<any>('https://api.coinbase.com/v2/prices/BTC-USD/spot', { timeout: 8000 })
    return { price: parseFloat(data.data.amount), source: 'coinbase' }
  } catch {}

  // Fallback 2: Kraken
  try {
    const data = await $fetch<any>('https://api.kraken.com/0/public/Ticker?pair=XBTUSD', { timeout: 8000 })
    const price = parseFloat(data.result.XXBTZUSD.c[0])
    return { price, source: 'kraken' }
  } catch {}

  // All sources failed — return null so store shows error state gracefully
  return { price: null, source: 'unavailable' }
})
