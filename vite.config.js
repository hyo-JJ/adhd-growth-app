import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const base = command === 'build' ? '/adhd-growth-app/' : '/'
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          id: base,
          name: '오늘 하나 · 성장관리',
          short_name: '오늘 하나',
          description: '여러 목표를 오늘 하나로 연결하는 ADHD 친화 성장관리 앱',
          start_url: base,
          scope: base,
          display: 'standalone',
          background_color: '#fdf1e6',
          theme_color: '#fdf1e6',
          lang: 'ko',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        },
      }),
    ],
  }
})
