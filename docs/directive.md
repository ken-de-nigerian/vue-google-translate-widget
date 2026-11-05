# Keeping Text Untranslated

Machine translation translates every word it can find, including the ones that should never change. "Lagos Eats"
becomes "Lagos Mange". A recipe ingredient called "Ofada rice" gets turned into something nobody can buy. A code
sample breaks. A street address becomes useless. You need a way to say "leave this alone", and the `v-no-translate`
directive is it.

```vue
<script setup lang="ts">
import { vNoTranslate } from '@ken_de_nigerian/vue-google-translate-widget'
</script>

<template>
  <span v-no-translate class="logo">Lagos Eats</span>
  <p>Serve with <span v-no-translate>ofada</span> rice and <span v-no-translate>ayamase</span> stew.</p>
</template>
```

The directive adds `translate="no"` and `class="notranslate"` to the element. Google's widget respects both, and so
does the package's own DOM engine when you use a [provider](providers.md). Everything inside the element is left
alone, children included.

## Good candidates

- Your brand and product names
- People's and places' names, where translation would mangle them
- Postal addresses, phone numbers, order and reference numbers
- Code, commands, file names and URLs shown as text
- Quotations that must stay in their original language
- Language names in your own UI: "Deutsch" should stay "Deutsch" whatever language the page is in

## Turning it on and off

Pass a boolean to apply it conditionally:

```vue
<span v-no-translate="ingredient.isLocalName">{{ ingredient.name }}</span>
```

`v-no-translate="false"` removes the attribute and class again; `v-no-translate` with no value means `true`.

## Registering it for the whole app

```ts
import { vNoTranslate } from '@ken_de_nigerian/vue-google-translate-widget'

app.directive('no-translate', vNoTranslate)
```

The [Nuxt module](nuxt.md) registers it for you.

## Server-side rendering

During server rendering, the directive outputs only `translate="no"`. The `notranslate` class is added in the
browser after hydration. If the class were rendered on the server, Vue would report a hydration class mismatch,
because it compares the whole `class` attribute while hydrating and the class isn't part of your template. Google
respects `translate="no"` on its own, so the element is protected from the first paint either way.

## What's skipped without the directive

You don't need to mark these yourself:

- `<script>`, `<style>`, `<noscript>` and `<template>`
- `<code>`, `<pre>`, `<textarea>`, `<svg>` and `<math>` (provider engine; Google handles most of these itself)
- Text with no letters in it, like "42" or "€ 12.50" (provider engine)
- The language names in the package's own components

If you're writing your own switcher with [the composable](composable.md), put `v-no-translate` on the language
names.
