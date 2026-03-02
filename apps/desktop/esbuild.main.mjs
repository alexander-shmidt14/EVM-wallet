import { build } from 'esbuild'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const commonOptions = {
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  sourcemap: true,
  // Only electron should be external - everything else gets bundled
  external: ['electron'],
  // Resolve workspace packages
  alias: {
    '@wallet/wallet-core': resolve(__dirname, '../../packages/wallet-core/src/index.ts'),
    '@wallet/ui-tokens': resolve(__dirname, '../../packages/ui-tokens/src/index.ts'),
  },
  loader: {
    '.json': 'json',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
}

// Build main process (backend)
await build({
  ...commonOptions,
  entryPoints: [resolve(__dirname, 'src/backend/main.ts')],
  outfile: resolve(__dirname, 'dist/main.js'),
})

// Build preload script (IIFE format — sandboxed preload doesn't have `module`)
await build({
  ...commonOptions,
  format: 'iife',
  sourcemap: false,
  entryPoints: [resolve(__dirname, 'src/backend/preload.ts')],
  outfile: resolve(__dirname, 'dist/preload.js'),
})

console.log('✅ Main process and preload bundled successfully')
