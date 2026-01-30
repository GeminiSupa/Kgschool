// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-01-01',
  devtools: { enabled: true },

  vite: {
    build: {
      rollupOptions: {
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
          // Use default warning handler for other warnings
          warn(warning)
        }
      }
    }
  },
  
  modules: [
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/tailwindcss',
    '@vite-pwa/nuxt'
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
    },
    devOptions: {
      enabled: false,
      suppressWarnings: true,
      navigateFallbackAllowlist: [/^\/$/],
      type: 'module'
    }
  },

  css: ['~/assets/css/tailwind.css'],

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
