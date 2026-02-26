export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,                          // SPA mode — no hydration mismatch
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  components: {
    dirs: [{ path: '~/components', pathPrefix: false }]
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'BTC Bottom Finder — 何時該抄底就看這裡',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '一站式監控 BTC 鏈上估值指標，幫你找到風險相對低的買入位置' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;600&display=swap' }
      ]
    }
  },
  routeRules: {
    '/api/**': { cors: true }
  },
  runtimeConfig: {
    public: {
      updateInterval: 60000
    }
  },
  nitro: {
    // Vercel serverless functions: allow up to 30s for external API calls
    vercel: {
      functions: {
        maxDuration: 30
      }
    }
  }
})
