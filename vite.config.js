import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  // For Vercel, use '/' as base. For GitHub Pages, use '/comdirect-analytics/'
  const isVercel = process.env.VERCEL === '1'
  const base = isVercel || command === 'serve' ? '/' : '/comdirect-analytics/'
  
  return {
    plugins: [react()],
    base: base,
    server: {
      port: 5173,
      open: true
    }
  }
})

