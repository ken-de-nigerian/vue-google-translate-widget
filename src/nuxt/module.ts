import { addComponent, addImports, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { GoogleTranslateConfig } from '../composables/useGoogleTranslate'

const PACKAGE = '@ken_de_nigerian/vue-google-translate-widget'

/**
 * The serializable part of the config (it travels through runtimeConfig).
 * For `provider`, `cache` or `onTranslate`, set `plugin: false` and register
 * `createGoogleTranslate()` in your own plugin (see the Nuxt docs chapter).
 */
export interface ModuleOptions extends Omit<
  GoogleTranslateConfig,
  'provider' | 'cache' | 'onTranslate' | 'initialLanguage'
> {
  /** Add the components' stylesheet to the app. Default: `true`. */
  css?: boolean
  /** Register the plugin that applies this config and the saved language during SSR. Default: `true`. */
  plugin?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: PACKAGE,
    configKey: 'googleTranslate',
    compatibility: { nuxt: '>=3.0.0' },
  },
  defaults: {
    css: true,
    plugin: true,
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const { css, plugin, ...config } = options

    nuxt.options.runtimeConfig.public.googleTranslate = config

    if (plugin) addPlugin(resolve('./nuxt-runtime/plugin.js'))

    for (const name of ['GoogleTranslateWidget', 'GoogleTranslateButton']) {
      addComponent({ name, export: name, filePath: PACKAGE })
    }
    addImports([
      { name: 'useGoogleTranslate', from: PACKAGE },
      { name: 'vNoTranslate', from: PACKAGE },
    ])

    if (css) nuxt.options.css.push(`${PACKAGE}/style.css`)
  },
})
