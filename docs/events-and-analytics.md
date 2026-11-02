# Events & Analytics

**Who this is for:** anyone tracking which languages visitors use. **At the end** you'll send language changes to
your analytics tool.

## One hook for the whole app

```ts
import { createGoogleTranslate } from '@ken_de_nigerian/vue-google-translate-widget'

app.use(
  createGoogleTranslate({
    onTranslate: ({ from, to, engine, trigger }) => {
      // GA4
      window.gtag?.('event', 'language_change', { from, to, trigger })
      // Plausible
      window.plausible?.('Language', { props: { to } })
      // PostHog
      window.posthog?.capture('language_change', { from, to, engine })
    },
  }),
)
```

`onTranslate` is called after every **successful** change, including restoring the original (`to` is then the page
language), with:

| Field | |
| --- | --- |
| `from` | The language before |
| `to` | The language now |
| `engine` | `'google-widget'`, or the provider's name |
| `trigger` | `'user'`, or `'auto'` for [`autoTranslate`](./plugin.md#auto-translate-on-the-first-visit) |

It isn't called for failed changes, and an error thrown inside it is logged without breaking the change.

(Declare the globals you use, e.g. `declare global { interface Window { gtag?: (...args: unknown[]) => void } }`.)

## Component events

Per component, listen to `change`, `error`, `ready`, `open` and `close`:

```vue
<GoogleTranslateButton @change="lang => track('language', lang)" @error="err => report(err)" />
```

## Reacting in code

```ts
const { currentLanguage } = useGoogleTranslate()
watch(currentLanguage, lang => document.title = titles[lang] ?? document.title)
```
