// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createGoogleTranslate, GoogleTranslateButton, GoogleTranslateWidget, useGoogleTranslate } from '../src'

const renderButton = (initialLanguage?: string) => {
  const app = createSSRApp({
    render: () =>
      h(
        GoogleTranslateButton,
        { includedLanguages: ['en', 'fr', 'de'] },
        {
          default: ({ current }: { current?: { nativeName: string } }) =>
            h('span', { class: 'label' }, current?.nativeName),
        },
      ),
  })
  app.use(createGoogleTranslate({ initialLanguage }))
  return renderToString(app)
}

describe('server-side rendering', () => {
  it('renders both components without touching window or document', async () => {
    expect(typeof window).toBe('undefined')
    const app = createSSRApp({ render: () => [h(GoogleTranslateWidget), h(GoogleTranslateButton)] })
    const html = await renderToString(app)

    expect(html).toContain('gtw-float-button')
    expect(html).toContain('gtb-button')
    expect(html).toContain('aria-expanded="false"')
  })

  it('renders the language from initialLanguage (e.g. the googtrans cookie)', async () => {
    expect(await renderButton('fr')).toContain('<span class="label">Français</span>')
    expect(await renderButton()).toContain('<span class="label">English</span>')
  })

  it('keeps concurrent requests apart', async () => {
    const [french, german, english] = await Promise.all([renderButton('fr'), renderButton('de'), renderButton()])
    expect(french).toContain('Français')
    expect(german).toContain('Deutsch')
    expect(english).toContain('English')
  })

  it('makes the composable a no-op on the server', async () => {
    const api = useGoogleTranslate()
    await expect(api.initializeTranslate()).resolves.toBeUndefined()
    await expect(api.changeLanguage('fr')).resolves.toBeUndefined()
    expect(api.currentLanguage.value).toBe('en')
    expect(api.status.value).toBe('idle')
  })
})
