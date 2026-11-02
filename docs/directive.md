# v-no-translate

**Who this is for:** anyone with content that must not be machine-translated. **At the end** you'll protect brand
names, code and addresses.

```vue
<script setup>
import { vNoTranslate } from '@ken_de_nigerian/vue-google-translate-widget'
</script>

<template>
  <span v-no-translate>PayZephyr</span>
  <span v-no-translate="isBrand">{{ name }}</span>
</template>
```

It adds `translate="no"` and `class="notranslate"`. Google's widget and the package's own provider engine both
honour them. `v-no-translate="false"` removes them.

To register it for the whole app:

```ts
app.directive('no-translate', vNoTranslate)
```

(The [Nuxt module](./nuxt.md) does this for you.)

During server-side rendering only `translate="no"` is rendered. The class is added after hydration, because Vue
compares the whole `class` attribute while hydrating and would otherwise report a mismatch.

Already skipped without the directive: `<script>`, `<style>`, `<code>`, `<pre>`, `<textarea>`, `<svg>`, and the
language names in the package's own UI.
