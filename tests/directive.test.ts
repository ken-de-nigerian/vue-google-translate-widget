import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, withDirectives } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createSSRApp } from 'vue'
import { vNoTranslate } from '../src'

describe('v-no-translate', () => {
  it('adds translate="no" and class="notranslate"', () => {
    const wrapper = mount({
      template: '<span v-no-translate>PayZephyr</span>',
      directives: { noTranslate: vNoTranslate },
    })
    expect(wrapper.attributes('translate')).toBe('no')
    expect(wrapper.classes()).toContain('notranslate')
  })

  it('can be switched off and on', async () => {
    const enabled = ref(false)
    const wrapper = mount(
      defineComponent({
        directives: { noTranslate: vNoTranslate },
        setup: () => ({ enabled }),
        template: '<span class="brand" v-no-translate="enabled">PayZephyr</span>',
      }),
    )
    expect(wrapper.attributes('translate')).toBeUndefined()
    expect(wrapper.classes()).toEqual(['brand'])

    enabled.value = true
    await wrapper.vm.$nextTick()
    expect(wrapper.attributes('translate')).toBe('no')
    expect(wrapper.classes()).toContain('brand')
  })

  it('renders translate="no" during SSR, without a class', async () => {
    // A render function, not a template: Vue 3.3/3.4's server renderer doesn't compile template strings.
    const app = createSSRApp({ render: () => withDirectives(h('b', 'Acme'), [[vNoTranslate]]) })
    const html = await renderToString(app)
    expect(html).toContain('translate="no"')
    // No class on the server: it would cause a hydration class mismatch (found in Nuxt dev mode).
    expect(html).not.toContain('class=')
  })
})
