# Upgrade Guide

## 1.x → 2.0

Most apps need **no code changes**. Read the list and adjust what applies.

### Breaking changes

| Change | What to do |
| --- | --- |
| `GoogleTranslateButton`'s `languageChanged` event was removed | Use `@change` (same payload). |
| Flags are **off** by default | Add `show-flags` to keep them, ideally with `flag-style="emoji"`. |
| `theme` defaults to `'auto'` (was `'light'`) | The components now go dark under `html.dark` or a dark OS setting. Add `theme="light"` to keep 1.x's look. |
| The stylesheet import path is `…/style.css` only | Replace `@ken_de_nigerian/vue-google-translate-widget/dist/style.css` with `@ken_de_nigerian/vue-google-translate-widget/style.css`. |
| The UMD build was removed | If you loaded the package with a `<script>` tag from a CDN, use the ESM build (`<script type="module">` with an import map, or esm.sh). CommonJS `require()` still works. |
| `main` now points to `dist/index.cjs` (was `dist/vue-google-translate-widget.umd.cjs`) | Only matters if you imported the file path directly. Import the package name instead. |

### New, and worth knowing

- **App-wide config**: `app.use(createGoogleTranslate({ … }))`. See [Plugin](./plugin.md).
- **Nuxt module**: `modules: ['@ken_de_nigerian/vue-google-translate-widget/nuxt']`, with server rendering of the
  saved language. See [Nuxt](./nuxt.md).
- **Providers**: translate with DeepL, Google Cloud, Azure or LibreTranslate instead of Google's free widget. See
  [Translation Providers](./providers.md).
- `onTranslate` for analytics, `autoTranslate`, and `?lang=` links (`queryParameter`).

### Upgrading step by step

```bash
npm install @ken_de_nigerian/vue-google-translate-widget@^2
```

1. Search your code for `languageChanged` → `change`.
2. Search for `dist/style.css` → `style.css`.
3. Decide on flags (`show-flags`) and theme (`theme="light"` for the old look).
4. Run your app and change the language once.

## 1.0 → 1.1

1.1 was backwards compatible. Two behaviour changes: languages switch **in place** (no reload; `mode: 'reload'`
for the old behaviour), and Google's branding is hidden automatically (`hide-branding="false"` to keep it).
`changeLanguage` and `initializeTranslate` return promises.
