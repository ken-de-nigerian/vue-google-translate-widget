# Installation

**Who this is for:** anyone adding the package to a Vue 3 or Nuxt app. **At the end** you'll have it installed,
with its stylesheet loaded.

## Requirements

- Vue **3.3 or newer** (tested on 3.3, 3.4 and 3.5)
- Any modern browser (Chrome, Edge, Firefox, Safari, desktop and mobile)
- For the server handlers (`/server`): any runtime with the Fetch API: Node 18+, Deno, Bun, Cloudflare Workers

## Install

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

## Load the stylesheet

The components need their CSS. Import it once, e.g. in `main.ts`:

```ts
import '@ken_de_nigerian/vue-google-translate-widget/style.css'
```

You don't need it if you only use the composable with your own UI, or the components with `unstyled`.

**Nuxt:** skip this whole page. Add the module instead, and it loads the CSS for you: see [Nuxt](./nuxt.md).

## What gets installed

The package has **no runtime dependencies**. It ships:

| Import | What it is |
| --- | --- |
| `@ken_de_nigerian/vue-google-translate-widget` | Components, composable, plugin, providers, directive (ESM and CommonJS) |
| `…/style.css` | The components' stylesheet |
| `…/server` | Server-side translation handlers (DeepL, Google Cloud, Azure, LibreTranslate) |
| `…/nuxt` | The Nuxt module |

Next: [Quick Start](./quick-start.md).
