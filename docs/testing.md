# Testing Your App

Once a language switcher is part of your app, your own tests will render it: a header test, a page test, an
end-to-end run. Two things go wrong if you do nothing about it. The component tries to load Google's real script,
which test environments block or which makes tests slow and flaky, and the package's page-level state (the current
language, the loaded script) carries over from one test into the next.

The `/testing` entry point solves both:

```ts
import { installFakeGoogleTranslate, resetGoogleTranslate } from '@ken_de_nigerian/vue-google-translate-widget/testing'
```

- **`installFakeGoogleTranslate()`** replaces Google's Website Translator with an in-memory fake that behaves like the
  real one: it renders Google's hidden language selector, marks the page as translated when the language changes
  (including `translated-rtl` for right-to-left languages), writes the `googtrans` cookie and provides "Show
  original". It makes no network requests and doesn't actually translate text.
- **`resetGoogleTranslate()`** forgets everything the package keeps per page, so the next test starts clean.

The package's own test suite uses this same fake, so it's exercised on every change.

## Setting it up with Vitest

```ts
// vitest.setup.ts
import { afterEach, beforeEach } from 'vitest'
import { installFakeGoogleTranslate, resetGoogleTranslate } from '@ken_de_nigerian/vue-google-translate-widget/testing'

beforeEach(() => {
  installFakeGoogleTranslate()
})

afterEach(() => {
  resetGoogleTranslate()
})
```

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'happy-dom', // or 'jsdom'
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

Jest works the same way: call the two functions in your setup file's `beforeEach` and `afterEach`.

## Testing a component that contains a switcher

Lagos Eats has a `SiteHeader` component with a `GoogleTranslateButton` in it, using the button's default slot to show
the current language (as in [GoogleTranslateButton](button.md#showing-the-current-language-on-the-button)). Here's a
test that the header shows it after a reader picks Yorùbá:

```ts
import { flushPromises, mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import SiteHeader from '../src/components/SiteHeader.vue'

it('shows the language the reader picked', async () => {
  const wrapper = mount(SiteHeader, { attachTo: document.body })
  await flushPromises() // let the (fake) translator load

  await wrapper.find('.gtb-button').trigger('click')
  await wrapper.findAll('[role="option"]').find(option => option.text().includes('Yorùbá'))!.trigger('click')
  await flushPromises()

  expect(wrapper.find('.gtb-button').text()).toContain('Yorùbá')
  expect(document.cookie).toContain('googtrans=/en/yo')
})
```

Selecting options by their role and visible text, as above, keeps the test close to what a reader does, and it keeps
working if you restyle the switcher.

## Testing your own switcher

If you built a switcher on [the composable](composable.md), test it through the composable's state:

```ts
import { useGoogleTranslate } from '@ken_de_nigerian/vue-google-translate-widget'

it('marks the active pill', async () => {
  const wrapper = mount(LanguagePills, { attachTo: document.body })
  await flushPromises()

  await wrapper.find('button[aria-pressed="false"]').trigger('click')
  await flushPromises()

  expect(useGoogleTranslate().currentLanguage.value).not.toBe('en')
  expect(wrapper.findAll('button[aria-pressed="true"]')).toHaveLength(1)
})
```

## Testing failure states

Pass the languages the fake should offer. Any other code behaves like one Google doesn't support, so
`changeLanguage()` rejects and the components emit `error`:

```ts
installFakeGoogleTranslate({ languages: ['fr'] })
```

To test what happens when Google can't load at all, don't install the fake for that test, and point `scriptSrc` at
a URL that fails, or wait for `timeout`.

## Options and details

| | |
| --- | --- |
| `installFakeGoogleTranslate({ languages? })` | Returns `{ constructed, restoreClicks, uninstall() }`. `languages` defaults to every built-in language. |
| `constructed` | The options Google's translator was created with. There should only ever be one per page. |
| `restoreClicks` | How many times "Show original" was clicked |
| `uninstall()` | Puts back whatever `window.google` was before, e.g. Google Maps |
| `resetGoogleTranslate()` | Resets the loaded script and hidden element, the current language and status, the `dir` observer, the provider engine, the branding stylesheet and the `googtrans` cookie |

"Show original" lives in an iframe, as in the real widget. jsdom gives iframes a document, so restoring the original
works in place. happy-dom doesn't by default, so restoring falls back to a page reload. To get the in-place behaviour, set
`enableIframePageLoading: true` and `disableIframePageLoading: false` in happy-dom's settings (in Vitest, under
`test.environmentOptions.happyDOM.settings`).

## End-to-end tests

In Playwright or Cypress, the real Google script loads like it does for visitors, and translation needs network
access to Google. For tests that don't need real translations, block the script so they stay fast and deterministic:

```ts
// Playwright
await page.route('**/translate_a/element.js*', route => route.abort())
```

The switcher then shows its "translation unavailable" state, which is also worth one test of its own.
