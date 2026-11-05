# Troubleshooting

Each entry follows the same shape: what you're seeing, why it usually happens, how to fix it, and how to check the fix
worked.

## "Translation is unavailable right now" {#translation-is-unavailable}

**Symptom:** the switcher opens, but shows this message at the top, and choosing a language does nothing. `status` is
`'error'`.

**Likely cause:** Google's script didn't load within `timeout` (ten seconds by default). In order of how often it
happens:

1. An ad blocker or privacy extension in your browser blocks `translate.google.com`.
2. Your Content Security Policy doesn't allow Google's hosts.
3. A network (an office firewall, some countries) blocks Google.

**Fix:**

1. Try a private window with extensions off. If it works there, it's an extension, and some of your visitors will
   have the same one; nothing on your side is broken.
2. Open the browser console and look for "Refused to load the script" messages. Add the hosts listed in
   [Security, CSP & Privacy](csp-and-privacy.md#content-security-policy), and pass your `nonce`.
3. Listen to the `error` event (or read `error.value` from the composable) to see the exact reason.

If many of your visitors are affected, switch to a [provider](providers.md), which doesn't depend on Google's script.

**Verify:** open the switcher and change the language; the message is gone and the page translates.

## `changeLanguage()` rejects with "does not support the language code"

**Symptom:** choosing a language does nothing, and the `error` event or a rejected promise says Google doesn't
support the code.

**Likely cause:** the code isn't one Google's widget knows. Usually it's a custom language list with a typo, a
three-letter code where Google uses two, or a language Google doesn't offer.

**Fix:** check the code against [Languages & Flags](languages.md#language-codes). Google uses `iw` for Hebrew, `jw`
for Javanese, and `zh-CN` / `zh-TW` for Chinese; the modern `he` and `jv` are converted for you.

**Verify:** the language now appears in the list and translates the page.

## Some text isn't translated

**Symptom:** most of the page translates, but some parts stay in the original language.

**Likely cause:** one of these:

- The text is inside an element marked `translate="no"` or `class="notranslate"`, or inside `<code>`, `<pre>` or
  `<textarea>`, which are skipped on purpose.
- It's part of an image, a canvas or an SVG. Machine translation only reaches text.
- With a provider: it's in an attribute that isn't in `translateAttributes` (only `placeholder`, `title`, `alt` and
  `aria-label` by default).
- It's inside an iframe, which is a separate page.

**Fix:** remove the `notranslate` marking if it shouldn't be there, or add the attribute to `translateAttributes`.

**Verify:** switch language again and check the text changes.

## The page is stuck in a language

**Symptom:** choosing the original language doesn't stick: after a reload, the page is translated again.

**Likely cause:** a `googtrans` cookie on a level of your domain the package didn't write, set by another app on the
same domain, or by your own code with a different `path`. Or the URL still has `#googtrans(…)` or `?lang=` in it.

**Fix:** choose the original language once from the switcher; it clears the cookie on every level of the domain and
removes `#googtrans` from the URL. If you set the cookie yourself anywhere, set it with `path=/` on one level only. If
you use `queryParameter`, check that links you share don't hard-code `?lang=`.

**Verify:** in your browser's developer tools, under Application → Cookies, there's no `googtrans` cookie after
restoring.

## The layout is mirrored wrongly in Arabic or Hebrew

**Symptom:** the text is in Arabic, but some elements stay on the left, or icons point the wrong way.

**Likely cause:** CSS that names sides explicitly (`margin-left`, `left: 0`, `text-align: left`) doesn't flip with
`dir="rtl"`.

**Fix:** use logical properties (`margin-inline-start`, `inset-inline-start`, `text-align: start`). See
[Right-to-Left Languages](rtl.md#what-your-css-needs).

**Verify:** `<html>` has `dir="rtl"` while the page is in Arabic, and the element is on the right.

## Hydration mismatch warnings in Nuxt

**Symptom:** after reloading a page in another language, the console shows "Hydration … mismatch" warnings mentioning
the switcher.

**Likely cause:** the server rendered the page's own language because it didn't know about the visitor's choice. This
happens if the module's plugin is off and your own plugin doesn't pass `initialLanguage`.

**Fix:** keep `plugin: true` (the default), or pass `initialLanguage` from the `googtrans` cookie as shown in
[Nuxt](nuxt.md#providers-ontranslate-and-other-functions).

**Verify:** reload in another language with the console open; no hydration warnings.

## Google's banner or hover highlight shows up again {#branding-reappears}

**Symptom:** a Google toolbar appears at the top of the page, the layout is pushed down, or translated sentences are
highlighted on hover.

**Likely cause:** Google renamed the elements the package hides, or `hide-branding` is `false`.

**Fix:** check `hide-branding` isn't turned off. If it isn't, Google has changed its markup: hide the element with
your own global CSS for now (inspect it in your browser's developer tools to find its class), and please
[open an issue](https://github.com/ken-de-nigerian/vue-google-translate-widget/issues) with a screenshot so the
package can be updated.

**Verify:** the toolbar is gone and the page isn't offset.

## Two switchers disagree, or one ignores its options

**Symptom:** a warning in the console says Google Translate is already loaded with a different `pageLanguage`, or one
switcher's options seem to have no effect.

**Likely cause:** Google's widget is loaded once per page, with the first switcher's `default-language`. A second one
with a different value can't change it.

**Fix:** set `defaultLanguage` once, with [the plugin](plugin.md) or the [Nuxt module](nuxt.md), instead of on each
component.

**Verify:** no warning in the console, and both switchers show the same current language.

## A third-party widget breaks after translating

**Symptom:** a chat bubble, map or booking widget stops working after the page is translated.

**Likely cause:** translation rewrote text inside it, and its code depended on that text.

**Fix:** mark the widget's container with [`v-no-translate`](directive.md). If that isn't possible, use
[reload mode](live-vs-reload.md).

**Verify:** translate the page and use the widget.
