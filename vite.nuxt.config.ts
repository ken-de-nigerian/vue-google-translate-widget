import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

// The Nuxt module and its runtime plugin: ESM only, everything external.
// Built after the main bundle (see the "build" script), into the same dist/.
export default defineConfig({
  plugins: [
    dts({ tsconfigPath: './tsconfig.json', include: ['src/nuxt'], entryRoot: 'src/nuxt', outDir: 'dist/nuxt-types' }),
  ],
  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        nuxt: resolve(__dirname, 'src/nuxt/module.ts'),
        'nuxt-runtime/plugin': resolve(__dirname, 'src/nuxt/runtime/plugin.ts'),
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: [/^#/, /^@nuxt\//, /^nuxt/, 'vue', '@ken_de_nigerian/vue-google-translate-widget'],
    },
  },
})
