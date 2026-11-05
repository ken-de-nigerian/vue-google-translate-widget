/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      bundleTypes: true,
      tsconfigPath: './tsconfig.json',
      include: ['src'],
      exclude: ['src/nuxt'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        server: resolve(__dirname, 'src/server/index.ts'),
      },
      formats: ['es', 'cjs'],
      // Vite 6+ names the stylesheet after the package; the published path is style.css.
      cssFileName: 'style',
      fileName: (format, name) => `${name}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        assetFileNames: assetInfo => {
          if (assetInfo.name === 'style.css') return 'style.css'
          return assetInfo.name || ''
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'happy-dom',
    environmentOptions: {
      // Tests must never fetch Google's real script; treat the blocked load as a no-op.
      happyDOM: {
        settings: {
          disableJavaScriptFileLoading: true,
          handleDisabledFileLoadingAsSuccess: true,
          // Google's "Show original" button lives in a same-origin about:blank iframe.
          disableIframePageLoading: false,
          enableIframePageLoading: true,
        },
      },
    },
    include: ['tests/**/*.test.ts'],
    restoreMocks: true,
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/vite-env.d.ts'],
      reporter: ['text', 'html', 'lcov'],
    },
  },
})
