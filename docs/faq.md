# FAQ

**Is this free?**
The package is MIT-licensed. Google's Website Translator is free. Providers like DeepL, Google Cloud and Azure are
paid per character; LibreTranslate is free to self-host.

**Is Google's widget going away?**
Google closed it to new sign-ups in 2019, but it still works, and a CI job checks the live widget every week. If you
can't accept that risk, use a [provider](./providers.md).

**Does it help SEO?**
No. Search engines index the original language, because translation happens in the browser. For multilingual SEO
you need server-rendered translations (e.g. vue-i18n with translated routes).

**Can I use it with vue-i18n?**
Yes. Mark the parts vue-i18n already translates with `v-no-translate`, and let this package handle the rest.

**Does it work without Vue?**
The components and composable need Vue 3.3+. The server handlers (`/server`) are framework-agnostic.

**React or Svelte?**
Not yet. The core (loader, cookies, DOM engine, providers) has no Vue dependency, so wrappers are possible.

**Why are flags off by default?**
A language isn't a country (is English 🇬🇧 or 🇺🇸?), and flag images are extra requests. Turn them on with
`show-flags`, ideally with `flag-style="emoji"`.

**Why "iw" for Hebrew?**
Google's widget still uses the old ISO codes `iw` and `jw`. `he` and `jv` work too.
