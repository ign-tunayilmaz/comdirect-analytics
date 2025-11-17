import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Use '/' for development, '/comdirect-analytics/' for production (GitHub Pages)
  base: command === 'serve' ? '/' : '/comdirect-analytics/',
  server: {
    port: 5173,
    open: true
  }
}))

