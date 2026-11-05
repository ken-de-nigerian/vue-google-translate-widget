# Production Checklist

Work through this before you ship translation to real visitors. Each item links to the chapter that explains why it
matters, if you want more than the checklist gives you.

## Setup

- [ ] `defaultLanguage` is the language your pages are actually written in, and it's the same everywhere: set it once
      with [the plugin](plugin.md) or the [Nuxt module](nuxt.md). A wrong value makes Google translate from the wrong
      language.
- [ ] The language list contains the languages your visitors use, plus your own so they can get back to the
      original. Any code that isn't built in has been checked against Google's list (or your provider's). See
      [Languages & Flags](languages.md#choosing-languages).
- [ ] The stylesheet is loaded (`…/style.css`), or every component is `unstyled`. See [Installation](installation.md).

## Content

- [ ] Brand names, product names, people's names, addresses, order numbers and code are marked with
      [`v-no-translate`](directive.md).
- [ ] Areas that show a signed-in visitor's personal data are marked with `v-no-translate`, so their contents aren't
      sent to the translation service. See [Security, CSP & Privacy](csp-and-privacy.md#whats-sent-where).
- [ ] Every page type has been viewed in a right-to-left language, and nothing is stuck on the wrong side. See
      [Right-to-Left Languages](rtl.md).
- [ ] Health, legal, safety or financial content is either human-translated or clearly labelled as machine
      translation. See [How Translation Works](how-it-works.md#what-machine-translation-can-and-cant-do).

## Security and privacy

- [ ] If your site has a Content Security Policy, it allows Google's hosts (or your translation endpoint), and you pass
      your `nonce`. Checked with the browser console open. See [Security, CSP & Privacy](csp-and-privacy.md#content-security-policy).
- [ ] Your privacy policy says that page text is sent to a translation service, and which one.

## If you use a provider

- [ ] The API key is only on the server, in an environment variable, and isn't in your JavaScript bundle. See
      [Translation Providers](providers.md#keep-api-keys-on-your-server).
- [ ] `maxCharacters` and `allowedTargets` are set on `createTranslateHandler`, there's rate limiting in front of the
      route, and a spending limit or budget alert in the service's dashboard. See
      [Security, CSP & Privacy](csp-and-privacy.md#protecting-your-translation-endpoint).
- [ ] `onError` on the handler logs upstream failures somewhere you'll see them.
- [ ] The service supports every language you offer.

## Failure and accessibility

- [ ] The "translation unavailable" state has been seen once: open the switcher with an ad blocker on, or with
      `scriptSrc` pointing at a URL that fails. See [Troubleshooting](troubleshooting.md#translation-is-unavailable).
- [ ] The switcher works from the keyboard alone: Tab to it, open it with Enter or ↓, choose with the arrow keys and
      Enter, close with Esc. See [Accessibility](accessibility.md).
- [ ] If you changed the theme's colours, text still has a contrast of 4.5:1 or more. See [Theming](theming.md).

## Nuxt

- [ ] Reloading a page in another language in development shows no hydration warnings in the console. See
      [Nuxt](nuxt.md).
- [ ] If you turned off the module's plugin, your own plugin passes `initialLanguage` and registers
      `v-no-translate`.

## Optional

- [ ] `onTranslate` sends language changes to your analytics. See [Events & Analytics](events-and-analytics.md).
- [ ] `lazy` is on if most visitors never translate. See [Performance](performance.md#lazy-loading).
- [ ] Your own tests use the fake from `/testing`. See [Testing Your App](testing.md).
