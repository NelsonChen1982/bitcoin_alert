export default defineEventHandler(async () => {
  try {
    // blockchain.info returns plain text number
    const blockHeight = await $fetch<string>('https://blockchain.info/q/getblockcount', {
      timeout: 10000,
    })
    return { blockHeight: parseInt(String(blockHeight)) }
  } catch {
    // Fallback approximate block height
    // Bitcoin produces ~52,560 blocks/year
    // Genesis: Jan 3, 2009; approximate from there
    const daysSinceGenesis = (Date.now() - new Date('2009-01-03').getTime()) / (1000 * 60 * 60 * 24)
    const approxBlock = Math.floor(daysSinceGenesis * 144) // ~144 blocks/day
    return { blockHeight: approxBlock, approximate: true }
  }
})
