import DefaultTheme from 'vitepress/theme'
import { useRoute, type Theme } from 'vitepress'
import { h, nextTick, onMounted, watch } from 'vue'
import LiveDemo from './LiveDemo.vue'
import NavTranslate from './NavTranslate.vue'

// The package's name must survive the live demo translating the page.
const protectBrand = () =>
  document
    .querySelectorAll('.VPNavBarTitle .title, .VPHero .name, .VPFooter .copyright a')
    .forEach(element => element.setAttribute('translate', 'no'))

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, { 'nav-bar-content-after': () => h(NavTranslate) }),
  enhanceApp({ app }) {
    app.component('LiveDemo', LiveDemo)
  },
  setup() {
    const route = useRoute()
    onMounted(protectBrand)
    watch(
      () => route.path,
      () => nextTick(protectBrand),
    )
  },
} satisfies Theme
