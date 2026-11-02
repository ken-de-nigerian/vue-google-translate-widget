# Production Checklist

**Who this is for:** anyone about to ship. Go through it once.

- [ ] **`defaultLanguage`** matches the language your pages are written in, and is the same everywhere.
- [ ] **Brand names, product names, code and addresses** are marked `v-no-translate` (or `class="notranslate"`).
- [ ] **CSP** allows what your engine needs ([CSP & Privacy](./csp-and-privacy.md)), and you pass `nonce` if you use one.
- [ ] **Privacy policy** mentions machine translation and where text is sent.
- [ ] **Blocked-script state** looks right: open the widget with an ad blocker on, or with `scriptSrc` set to a bad URL.
- [ ] **RTL**: switch to Arabic and check your layout (logical CSS properties, see [Right-to-Left](./rtl.md)).
- [ ] **Keyboard**: Tab to the switcher, open it with Enter or ↓, choose with the arrows and Enter, close with Esc.
- [ ] **Using a provider**: the API key is only on the server; `maxCharacters` / `allowedTargets` are set; there's rate
      limiting in front of the endpoint; `onError` logs upstream failures.
- [ ] **Nuxt**: a reload with a saved language shows no hydration warnings in dev.
- [ ] **Analytics** (optional): `onTranslate` sends events.
