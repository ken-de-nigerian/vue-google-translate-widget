---
layout: home

hero:
  name: Vue Google Translate Widget
  text: Your Vue site, in 100+ languages
  tagline: An accessible language switcher that translates the page in place. Google's free widget by default, or DeepL, Google Cloud, Azure and LibreTranslate behind your own server.
  actions:
    - theme: brand
      text: Quick Start
      link: /quick-start
    - theme: alt
      text: How it works
      link: /how-it-works
    - theme: alt
      text: GitHub
      link: https://github.com/ken-de-nigerian/vue-google-translate-widget

features:
  - title: No page reloads
    details: Languages switch in place, and restoring the original is instant. The choice is remembered across pages.
  - title: Accessible
    details: A real dialog and listbox with full keyboard support, focus management and screen-reader announcements, checked with axe-core.
  - title: Not locked to Google
    details: Swap Google's free widget for DeepL, Google Cloud, Azure or LibreTranslate, with API keys kept on your server.
  - title: Nuxt-ready
    details: A module with auto-imports and server rendering of the visitor's language, so hydration matches.
  - title: Yours to style
    details: Light, dark and auto themes, CSS custom properties, slots, or fully unstyled.
  - title: Right-to-left aware
    details: Sets dir="rtl" for Arabic, Hebrew, Persian and Urdu, and puts it back afterwards.
---

## Try it

<ClientOnly>
  <LiveDemo />
</ClientOnly>

## Install

```bash
npm install @ken_de_nigerian/vue-google-translate-widget
```

```vue
<script setup>
import { GoogleTranslateWidget } from '@ken_de_nigerian/vue-google-translate-widget'
import '@ken_de_nigerian/vue-google-translate-widget/style.css'
</script>

<template>
  <GoogleTranslateWidget />
</template>
```

Then read the [Quick Start](./quick-start.md).
