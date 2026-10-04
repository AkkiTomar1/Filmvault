/// <reference types="vitest/config" />
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
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

/**
 * GitHub Pages cannot set response headers, so the Content-Security-Policy is
 * injected as a <meta http-equiv> tag instead. This is a compensating control
 * for the auth design: the refresh token lives in localStorage, so an XSS
 * would otherwise be able to exfiltrate a long-lived credential. Keeping
 * `script-src` at 'self' closes the injection surface.
 *
 * `apply: 'build'` matters — the dev server needs inline scripts and eval for
 * React Fast Refresh and the HMR client, so shipping this in dev would break
 * `npm run dev`. `build.modulePreload.polyfill` is disabled below so Vite does
 * not emit its inline polyfill script, which would violate `script-src 'self'`.
 */
function cspHtmlMeta(apiUrl) {
  return {
    name: 'csp-html-meta',
    apply: 'build',
    transformIndexHtml(html) {
      const connect = [
        "'self'",
        'https://api.themoviedb.org',
        'https://api.watchmode.com',
        apiUrl,
      ]
        .filter(Boolean)
        .join(' ')

      const policy = [
        "default-src 'self'",
        "script-src 'self'",
        // React inline `style` attributes are governed by style-src.
        "style-src 'self' 'unsafe-inline'",
        // image.tmdb.org for posters/backdrops; `https:` covers the arbitrary
        // CDN hosts Watchmode returns in `logo_100px` (src/api/watchmode.ts).
        "img-src 'self' data: blob: https://image.tmdb.org https:",
        `connect-src ${connect}`,
        "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
        "media-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
      ].join('; ')

      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
            injectTo: 'head-prepend',
          },
        ],
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), cspHtmlMeta(env.VITE_API_URL), spa404Fallback()],
    base: '/Filmvault/',
    build: {
      // Emit no inline polyfill script so `script-src 'self'` can hold.
      modulePreload: { polyfill: false },
    },
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: './src/test/setup.ts',
      css: false,
    },
  }
})