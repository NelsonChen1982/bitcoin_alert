export default defineEventHandler(async () => {
  try {
    const data = await $fetch<any>('https://api.alternative.me/fng/?limit=30', {
      timeout: 10000,
    })
    return data
  } catch {
    // Never throw — return empty data so store handles gracefully
    return { data: [] }
  }
})
