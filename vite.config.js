/// <reference types="vitest/config" />
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function spa404Fallback() {
  return {
    name: 'spa-404-fallback',
    closeBundle() {
      const outDir = path.resolve('dist')
      try {
        fs.copyFileSync(path.join(outDir, 'index.html'), path.join(outDir, '404.html'))
        console.log('Emitted dist/404.html for SPA deep-link fallback on static hosts.')
      } catch (err) {
        console.warn('Could not write 404.html fallback:', err)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), spa404Fallback()],
  base: '/Filmvault/',
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
})