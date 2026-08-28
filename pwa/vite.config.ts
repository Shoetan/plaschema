import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['logo.svg'],
      manifest: {
        name: 'PLASCHEMA Field Worker',
        short_name: 'PLASCHEMA',
        description: 'Field worker enrollment app',
        theme_color: '#9fe870',
        background_color: '#fafafa',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: { navigateFallback: '/index.html' },
    }),
  ],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
