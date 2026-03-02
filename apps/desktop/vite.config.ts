import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  root: 'src/renderer',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      external: ['electron'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@wallet/wallet-core': resolve(__dirname, '../../packages/wallet-core/dist'),
      '@wallet/ui-tokens': resolve(__dirname, '../../packages/ui-tokens/dist'),
      buffer: 'buffer',
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      assert: 'assert',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify',
      url: 'url',
      util: 'util',
    },
  },
  define: {
    global: 'globalThis',
    process: {
      env: {},
    },
  },
  optimizeDeps: {
    include: [
      'buffer',
      'process',
      'crypto-browserify',
      'stream-browserify',
      'assert',
      'util',
    ],
  },
  css: {
    postcss: './postcss.config.js',
  },
  // Allow the dev server to accept connections on localhost so it can
  // be opened in a browser while the API server runs on the same machine.
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
})
