/**
 * Global CORS middleware — applies to ALL /api/* routes.
 * Ensures even error responses include Access-Control headers
 * so the browser never treats them as CORS failures.
 */
export default defineEventHandler((event) => {
  const origin = getRequestHeader(event, 'origin') || '*'

  setResponseHeaders(event, {
    'Access-Control-Allow-Origin':  origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age':       '86400',
  })

  // Handle preflight
  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
})
