// https://nuxt.com/docs/api/configuration/nuxt-config
const isProduction = process.env.NODE_ENV === 'production'

export default defineNuxtConfig({
  compatibilityDate: '2024-01-01',
  devtools: { enabled: true },

  vite: {
    build: {
      rollupOptions: {
        external: (id) => {
          // Mark webpack as external - it's only needed at build time, not runtime
          if (id === 'webpack' || id.startsWith('webpack/')) {
            return true
          }
          return false
        },
        onwarn(warning, warn) {
          // Suppress Supabase internal unused import warnings
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT' && 
              warning.source?.includes('@supabase/')) {
            return
          }
          // Suppress warnings about unused external module imports
          if (warning.message?.includes('is imported from external module') &&
              warning.message?.includes('@supabase/')) {
            return
          }
          // Suppress PWA manifest errors in dev mode (harmless)
          if (warning.message?.includes('#app-manifest')) {
            return
          }
          // Suppress webpack resolution errors - it's external
          if (warning.message?.includes('webpack') || 
              warning.code === 'UNRESOLVED_IMPORT' && warning.message?.includes('webpack')) {
            return
          }
          // Use default warning handler for other warnings
          warn(warning)
        }
      },
      commonjsOptions: {
        transformMixedEsModules: true
      }
    },
    optimizeDeps: {
      exclude: ['webpack']
    }
  },
  
  modules: [
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/tailwindcss',
    // Only enable PWA in production to avoid dev mode manifest errors
    ...(isProduction ? ['@vite-pwa/nuxt'] : [])
  ],

  // Explicitly prevent i18n from being auto-detected
  ignore: [
    '**/node_modules/@nuxtjs/i18n/**'
  ],

  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY,
    redirect: false, // Disable Supabase auto-redirect completely - we handle it manually
    redirectOptions: {
      login: '/login',
      callback: '/auth/callback',
      exclude: ['/', '/login', '/signup', '/auth/callback', '/admin', '/teacher', '/parent', '/kitchen']
    }
  },

  // PWA configuration - only used in production
  ...(isProduction ? {
    pwa: {
      registerType: 'autoUpdate',
      manifest: {
        name: 'Kindergarten Management System',
        short_name: 'KG School',
        description: 'Kindergarten Management System',
        theme_color: '#0070F2',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        navigateFallback: '/',
        globPatterns: ['**/*.{js,css,html,png,svg,ico}']
      },
      client: {
        installPrompt: true,
        periodicSyncForUpdates: 20
      }
    }
  } : {}),

  css: [
    '~/assets/css/tailwind.css',
    '~/assets/css/fiori-design-system.css'
  ],

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    },
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },

  app: {
    head: {
      title: 'Kindergarten Management System',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Kindergarten Management System' },
        { name: 'theme-color', content: '#0070F2' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  }
})
