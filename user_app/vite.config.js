import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'DRT Connect',
        short_name: 'DRT Connect',
        description: 'Smart DRT Mobility App',
        theme_color: '#f8f9ff',
        background_color: '#f8f9ff',
        display: 'standalone',
        icons: [
          {
            src: 'https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
})
