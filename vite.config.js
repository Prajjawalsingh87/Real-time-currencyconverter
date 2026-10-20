import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const LATEST_RATES = /^https:\/\/(cdn\.jsdelivr\.net\/npm\/@fawazahmed0\/currency-api@latest|latest\.currency-api\.pages\.dev)\//
const DATED_RATES = /^https:\/\/(cdn\.jsdelivr\.net\/npm\/@fawazahmed0\/currency-api@\d{4}-\d{2}-\d{2}|\d{4}-\d{2}-\d{2}\.currency-api\.pages\.dev)\//

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'FX Live · Currency Converter',
        short_name: 'FX Live',
        description: 'Convert 200+ currencies, crypto and metals with live exchange rates.',
        theme_color: '#ffffff',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Latest rates and currency names: try the network, but fall back to
            // the last saved copy after 3 s or when offline.
            urlPattern: LATEST_RATES,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'fx-latest-rates',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Rates for a past date never change, so the history chart can use the cache first.
            urlPattern: DATED_RATES,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fx-history',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
})
