# Events & Analytics

Once a language switcher is live, the obvious question is whether anyone uses it, and for which languages. Lagos Eats
added Yorùbá, Igbo and Hausa on a hunch; a month of data tells them whether to invest in human translations of their
most popular recipes. This chapter shows how to get that data, and the other ways to react to language changes.

## One hook for the whole app

`onTranslate` is called after every successful change, wherever it came from: either component, your own switcher, or
[automatic translation](plugin.md#translating-automatically-on-the-first-visit).

```ts
// main.ts
createGoogleTranslate({
  onTranslate: ({ from, to, engine, trigger }) => {
    analytics.track('language_change', { from, to, engine, trigger })
  },
})
```

| Field | |
| --- | --- |
| `from` | The language the page was in |
| `to` | The language it's in now. When a visitor goes back to the original, this is the page's own language. |
| `engine` | `'google-widget'`, or your [provider's](providers.md) name |
| `trigger` | `'user'` when the visitor chose it, `'auto'` when `autoTranslate` did |

It isn't called for changes that fail, so you only count translations that actually happened. If your handler throws
(an analytics script that didn't load, say), the error is logged to the console and the translation carries on.

## Sending it to your analytics tool

Each tool has a global function from its snippet. Declare the one you use so TypeScript knows about it:

```ts
// analytics.d.ts
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void
    posthog?: { capture: (event: string, properties?: Record<string, unknown>) => void }
  }
}
export {}
```

::: code-group

```ts [Google Analytics 4]
onTranslate: ({ from, to, trigger }) => {
  window.gtag?.('event', 'language_change', { from_language: from, to_language: to, trigger })
}
```

```ts [Plausible]
onTranslate: ({ to, trigger }) => {
  window.plausible?.('Language change', { props: { language: to, trigger } })
}
```

```ts [PostHog]
onTranslate: ({ from, to, engine, trigger }) => {
  window.posthog?.capture('language_change', { from, to, engine, trigger })
}
```

:::

In Nuxt, `onTranslate` is a function, so it goes in your own plugin rather than `nuxt.config`; see
[Nuxt](nuxt.md#providers-ontranslate-and-other-functions).

## Component events

Each component also emits events, which is handy for behaviour tied to one switcher:

```vue
<GoogleTranslateButton
  @change="language => closeMobileMenu()"
  @error="error => reportToSentry(error)" />
```

| Event | When |
| --- | --- |
| `change` | After the page has been translated or restored |
| `error` | Loading failed, or a change couldn't be applied |
| `ready` | The translation engine has loaded |
| `open`, `close` | The dialog or dropdown opened or closed |

## Reacting to the language in code

`currentLanguage` from [the composable](composable.md) is a ref, so you can use it anywhere. Lagos Eats shows a
short notice on recipes while they're machine-translated, so readers know to double-check quantities:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useGoogleTranslate } from '@ken_de_nigerian/vue-google-translate-widget'

const { currentLanguage, pageLanguage } = useGoogleTranslate()
const machineTranslated = computed(() => currentLanguage.value !== pageLanguage)
</script>

<template>
  <p v-if="machineTranslated" class="notice">
    This recipe was translated automatically. Check quantities against the original.
  </p>
</template>
```

The notice itself is translated along with the rest of the page, so readers see it in their language.
