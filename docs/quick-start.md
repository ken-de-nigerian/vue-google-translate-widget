# Your First Language Switcher

Let's add translation to something real. **Lagos Eats** is a small recipe site written in English. Its analytics
show a lot of readers in France, a growing audience across Nigeria reading in Yorùbá, Igbo and Hausa, and visitors
from the Gulf. Nobody on the team has time to translate every recipe by hand, so machine translation of the page is a
good fit. By the end of this chapter, a reader will be able to pick a language and see the recipe in it, without the
page reloading, and the site's name won't get translated along the way.

If you haven't installed the package yet, see [Installation](installation.md) first.

## Step 1: Add the widget

The quickest way to start is `GoogleTranslateWidget`: a round button in the corner of the screen that opens a
searchable list of languages. Put it in your root component, so it's on every page:

```vue
<!-- App.vue -->
<script setup lang="ts">
import { GoogleTranslateWidget } from '@ken_de_nigerian/vue-google-translate-widget'
import '@ken_de_nigerian/vue-google-translate-widget/style.css'
</script>

<template>
  <RouterView />
  <GoogleTranslateWidget />
</template>
```

Open the site and click the button in the bottom-left corner. You'll see 110 languages, each listed under its own
name ("Français", "Yorùbá", "العربية") with the English name underneath. Pick one and the recipe is translated in
place, usually within a second or two. The very first translation of a visit can take a little longer while Google's
service warms up.

Here's what just happened behind the scenes. The component loaded Google's Website Translator script once, into a
hidden element, and when you chose a language it told Google to translate the page. Google rewrote the text on the
page directly, which is why there was no reload. It also saved your choice in a cookie called `googtrans`, so if you
go to another recipe, or come back tomorrow, the site is still in that language. The full story, including what
happens when Google's script is blocked, is in [How Translation Works](how-it-works.md).

## Step 2: Offer the languages your readers actually use

A list of 110 languages is a lot to scroll through when almost everyone wants one of six. Narrow it down:

```vue
<GoogleTranslateWidget :included-languages="['en', 'fr', 'yo', 'ig', 'ha', 'ar']" />
```

Keep `en` in the list: it's how readers get back to the original. Choosing the page's own language restores the
original text, again without a reload.

If you'd rather show everything but put the popular ones first, use `pinned` instead:

```vue
<GoogleTranslateWidget :pinned="['fr', 'yo', 'ig', 'ha', 'ar']" />
```

## Step 3: Keep the brand name as it is

Switch to French and look at the header: Google has probably translated "Lagos Eats" into something like "Lagos
Mange". Machine translation doesn't know which words are names. Mark them with the `v-no-translate` directive:

```vue
<script setup lang="ts">
import { vNoTranslate } from '@ken_de_nigerian/vue-google-translate-widget'
</script>

<template>
  <header>
    <span v-no-translate class="logo">Lagos Eats</span>
  </header>
</template>
```

The directive adds `translate="no"` and `class="notranslate"`, which Google respects. Use it for anything that should
stay exactly as written: product names, people's names, addresses, prices with units, code. [Keeping Text
Untranslated](directive.md) covers the details, including how it behaves with server-side rendering.

## Step 4: Check Arabic

Pick العربية. Arabic is written right to left, and the package sets `dir="rtl"` on the `<html>` element while the
page is in Arabic, so your layout mirrors. Look over the recipe page: if something stays stuck on the wrong side, it's
usually CSS written with `left`/`right` instead of logical properties like `margin-inline-start`. [Right-to-Left
Languages](rtl.md) shows what to change.

Switch back to English and `dir` goes back to what it was.

## Step 5: Tell the package what language your site is in

Lagos Eats is in English, which is the default, so there was nothing to do. If your site is written in another
language, say so, or Google will assume English and translate from the wrong language:

```vue
<GoogleTranslateWidget default-language="fr" />
```

## Step 6: Set it up once for the whole app

As the site grows you might add a second switcher, a compact `GoogleTranslateButton` in the navigation bar. Rather
than repeating the same settings on both, set them once with the plugin:

```ts
// main.ts
import { createApp } from 'vue'
import { createGoogleTranslate } from '@ken_de_nigerian/vue-google-translate-widget'
import '@ken_de_nigerian/vue-google-translate-widget/style.css'
import App from './App.vue'

createApp(App)
  .use(
    createGoogleTranslate({
      defaultLanguage: 'en',
      includedLanguages: ['en', 'fr', 'yo', 'ig', 'ha', 'ar'],
    }),
  )
  .mount('#app')
```

Now every component and every call to `useGoogleTranslate()` uses those settings, and you can still override them
on an individual component. Both switchers share one translation of the page, so choosing French in the navbar also
shows French as selected in the floating widget. [Configuration](plugin.md) lists everything you can set there.

## What you have now

- A language switcher on every page, with keyboard and screen-reader support built in.
- Translation in place, remembered across pages and visits.
- The site's name protected from translation.
- Correct right-to-left layout for Arabic.

## Where to go next

- **On Nuxt?** The [Nuxt module](nuxt.md) does all of this with auto-imports, and renders the reader's language on
  the server so the first paint is right.
- **Want it to match your design?** See [Theming](theming.md).
- **Want to know which languages readers pick?** See [Events & Analytics](events-and-analytics.md).
- **Worried about depending on Google's free widget?** [Translation Providers](providers.md) explains how to switch
  to DeepL, Google Cloud, Azure or LibreTranslate without changing any of the code above.
- **Shipping soon?** Work through the [Production Checklist](production-checklist.md).
