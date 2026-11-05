# FAQ

## Is it free?

The package is MIT-licensed. Google's Website Translator, the default, is free. If you use a
[provider](providers.md), DeepL, Google Cloud and Azure charge per character translated (each has a free allowance);
LibreTranslate is free to self-host.

## Is Google's widget going away?

Google closed it to new sign-ups in 2019, and makes no promise to keep it running, but existing integrations like this
one still work. A CI job loads the live widget every week to catch changes. If you can't accept the risk, use a
[provider](providers.md); your components and code stay the same.

## Will translated pages show up in search engines?

No. Translation happens in the visitor's browser, after the page loads, so search engines index your site in its
original language only. For multilingual SEO you need translations rendered on the server at their own URLs, which is
what vue-i18n with translated routes is for. See [How Translation Works](how-it-works.md#what-machine-translation-can-and-cant-do).

## Can I use it with vue-i18n?

Yes, and many sites should. Use vue-i18n for the parts you translate by hand (navigation, buttons, legal text) in the
languages you support properly, and this package to make everything else readable in many more. Mark the parts
vue-i18n already handles with `v-no-translate`, so they aren't machine-translated on top.

## Does it work without Vue?

The components, composable and plugin need Vue 3.3 or newer. The server handlers in `/server` don't depend on Vue and
work in any JavaScript server.

## What about React or Svelte?

Not in this package, which is built for Vue. The parts that do the work (loading Google's widget, the cookie handling,
the DOM engine and providers) don't depend on Vue, so wrappers for other frameworks are possible; if you'd use one,
[open an issue](https://github.com/ken-de-nigerian/vue-google-translate-widget/issues) to say so.

## Why are flags off by default?

A language isn't a country. English is spoken in Britain, the United States, Nigeria and dozens of other places; any
single flag is wrong for many readers looking for it. Flag images are also extra requests. Turn them on with
`show-flags`, ideally with `flag-style="emoji"`. See [Languages & Flags](languages.md#flags).

## Why "iw" for Hebrew?

Google's widget still uses the old codes `iw` (Hebrew) and `jw` (Javanese). The modern `he` and `jv` work everywhere
too and are converted for you.

## Can I translate only part of the page?

Not directly: Google's widget translates the whole page. You can do the reverse, though, by marking the parts that
shouldn't be translated with [`v-no-translate`](directive.md).

## Does it work offline?

Translation needs the network, either to Google or to your translation service. With a provider, translations already
in the cache keep working offline.
