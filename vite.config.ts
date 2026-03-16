import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tailwindcss from '@tailwindcss/vite'

import { tanstackStart } from '@tanstack/solid-start/plugin/vite'
import solidPlugin from 'vite-plugin-solid'
import { cloudflare } from '@cloudflare/vite-plugin'

import lucidePreprocess from 'vite-plugin-lucide-preprocess'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    lucidePreprocess(),
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart(),
    solidPlugin({ ssr: true }),
  ],
})
