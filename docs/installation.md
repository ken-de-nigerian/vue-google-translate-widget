# Installation

This chapter gets the package into your project and its stylesheet onto the page. If you're using Nuxt, read the
first section and then skip to [Nuxt](nuxt.md): the module does the rest of this page for you.

## Requirements

- **Vue 3.3 or newer.** The test suite runs on Vue 3.3, 3.4 and 3.5 on every change.
- **A modern browser.** Current Chrome, Edge, Firefox and Safari, on desktop and mobile.
- **Nuxt 3 or 4**, if you use the Nuxt module. Both are built and tested in CI.
- **A runtime with the Fetch API** (Node 18+, Deno, Bun, Cloudflare Workers) if you use the server handlers for
  DeepL, Google Cloud, Azure or LibreTranslate. Most apps don't need them; see
  [Translation Providers](providers.md) for when you would.

## Install the package

::: code-group

```bash [npm]
npm install @ken_de_nigerian/vue-google-translate-widget
```

```bash [pnpm]
pnpm add @ken_de_nigerian/vue-google-translate-widget
```

```bash [yarn]
yarn add @ken_de_nigerian/vue-google-translate-widget
```

:::

The package has no runtime dependencies of its own. Vue is a peer dependency, so it uses the copy your app already
has.

## Load the stylesheet

The two ready-made components, `GoogleTranslateWidget` and `GoogleTranslateButton`, need their CSS. Import it once,
wherever you set up your app:

```ts
// main.ts
import { createApp } from 'vue'
import '@ken_de_nigerian/vue-google-translate-widget/style.css'
import App from './App.vue'

createApp(App).mount('#app')
```

You can leave the stylesheet out in two situations:

- You only use the [`useGoogleTranslate` composable](composable.md) and render your own UI.
- Every component you use has the `unstyled` prop, because you're styling them yourself (see
  [Theming](theming.md#starting-from-scratch)).

::: tip Upgrading from 1.x?
The stylesheet used to be imported from `…/dist/style.css`. In 2.0 the only path is `…/style.css`. The
[Upgrade Guide](upgrade-guide.md) lists everything else that changed.
:::

## What you just installed

Everything lives in one package, split into entry points so you only pull in what you import:

| Import | What's in it |
| --- | --- |
| `@ken_de_nigerian/vue-google-translate-widget` | The components, the composable, the app-wide plugin, the providers and the `v-no-translate` directive |
| `…/style.css` | The components' stylesheet |
| `…/server` | Server-side handlers that keep API keys for DeepL, Google Cloud, Azure or LibreTranslate off the browser |
| `…/nuxt` | The Nuxt module |

The main entry ships as ESM and CommonJS with TypeScript declarations for both, so it works with Vite, webpack,
Rollup, Jest and plain Node without configuration. Bundlers drop anything you don't import: a page that only uses
`GoogleTranslateWidget` gets about 11 kB of JavaScript (minified and compressed). [Performance](performance.md) has the
numbers for each entry.

## Next

With the package installed, [Your First Language Switcher](quick-start.md) walks through adding one to a real page
and what happens when a visitor uses it.
