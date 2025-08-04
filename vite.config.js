import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

var baseUrl = "/todos/"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    devOptions: {
      enabled: false,
      type: 'module',
      navigateFallback: 'index.html',
    },
    manifest: {
      name: 'Todo App',
      short_name: 'TodoApp',
      description: 'A simple to-do application',
      start_url: baseUrl,
      background_color: '#ffffff',
      theme_color: '#000000',
      icons: [
        {
          "src": "/icon.png",
          "sizes": "256x256",
          "type": "image/png"
        }
      ],
      workbox: {
        // defining cached files formats
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
      },
    },
  })],
  base: baseUrl,
})
