# Languages & Flags

Which languages to offer is the first real decision. This chapter covers how to choose them, the language codes
(including two odd ones), how to order the list for your readers, and why flags are off by default.

## Choosing languages

Most sites only need a handful. Offer the ones your readers actually use, plus your own language so they can get back
to the original:

```vue
<GoogleTranslateWidget :included-languages="['en', 'fr', 'yo', 'ig', 'ha', 'ar']" />
```

The built-in list has 110 languages, each with its English name, its own name and a flag. Google's widget
supports 248, so if you need one that isn't built in, pass your own list. You can start from the built-in one:

```ts
import { DEFAULT_LANGUAGES, type Language } from '@ken_de_nigerian/vue-google-translate-widget'

const languages: Language[] = [
  ...DEFAULT_LANGUAGES.filter(language => ['en', 'fr', 'yo'].includes(language.code)),
  { name: 'Twi', nativeName: 'Twi', code: 'ak', flag: 'gh' },
  { name: 'Ewe', nativeName: 'Eʋegbe', code: 'ee', flag: 'gh' },
]
```

```vue
<GoogleTranslateWidget :languages="languages" />
```

Both `included-languages` and `languages` are reactive: change them and the list updates.

::: warning Check that Google supports a code
A language in your list that Google doesn't support makes `changeLanguage()` reject with "Google Translate does not
support the language code". Twi (`ak`) and Ewe (`ee`) above are both in Google's list; check any other code you add
against Google's list (or your provider's) before you ship it.
:::

## Language codes

Codes are Google's, and mostly the familiar ISO ones: `fr`, `de`, `yo`, plus regional variants like `zh-CN`,
`zh-TW` and `pt-PT`. Two aren't what you'd expect:

| Language | Google's code | Modern code |
| --- | --- | --- |
| Hebrew | `iw` | `he` |
| Javanese | `jw` | `jv` |

Google's widget still uses the old codes. The built-in list uses them too, and the modern ones are accepted
everywhere a code is (`included-languages`, `pinned`, `changeLanguage()`, `?lang=`) and converted for you.
`toGoogleCode()` does the conversion if you need it yourself.

Every built-in code is checked against Google's real widget. CI tests the list against a snapshot of the widget's own
language list, and a scheduled job loads the live widget every week and fails if Google adds, removes or renames
anything. That's how 1.0's Hebrew and Javanese entries were found to have never worked.

## Ordering the list

A list of 110 languages is easier to use when the likely ones come first:

```vue
<GoogleTranslateWidget :pinned="['fr', 'yo', 'ig', 'ha']" :remember-recent="3" />
```

- **`pinned`** puts those codes first, in the order you give.
- **`remember-recent`** puts the visitor's recent choices next, so a reader who switches between English and Yorùbá
  finds Yorùbá at the top. It's kept in the visitor's `localStorage`; `true` keeps three, a number keeps that many.
  If storage is unavailable (private browsing, blocked cookies), the list just isn't reordered.
- Everything else follows in the order of your list. The built-in list is alphabetical by English name.

## Which name to show

```vue
<GoogleTranslateWidget display="native" />
```

| `display` | Shows | Default for |
| --- | --- | --- |
| `'native'` | "Deutsch" | `GoogleTranslateButton` |
| `'english'` | "German" | |
| `'both'` | "Deutsch", with "German" underneath | `GoogleTranslateWidget` |

Native names are the most important part. A German reader looking at a page in Arabic can't read "German" in Arabic,
but they recognize "Deutsch". That's why native names are protected from translation, while the English names are
allowed to translate into the page's current language.

## Flags {#flags}

Flags are **off by default**. Languages aren't countries: English is spoken in Britain, the United States, Nigeria and
dozens of other places, and Portuguese, Spanish, French and Arabic are the same. Any one flag is wrong for many of the
readers who look for it. Flag images are also extra requests to a third-party server.

If you want them anyway:

```vue
<!-- Images from flagcdn.com -->
<GoogleTranslateWidget show-flags />

<!-- Emoji: no requests at all -->
<GoogleTranslateWidget show-flags flag-style="emoji" />

<!-- Your own images -->
<GoogleTranslateWidget show-flags :flag-url="flag => `/images/flags/${flag}.svg`" />
```

The built-in list avoids the most contested choices. Catalan, Basque and Galician use their regional flags, Brazilian
and European Portuguese have separate entries, and Esperanto and Kurdish show a small language-code badge instead of
a country's flag. Set `flag: ''` on a language in your own list to show the badge. With emoji flags, a flag that has
no emoji (like the Catalan one) also falls back to the badge.

## Built-in languages

<!-- generated:languages:start -->
| Language | Native name | Code |
| --- | --- | --- |
| Afrikaans | Afrikaans | `af` |
| Albanian | Shqip | `sq` |
| Amharic | አማርኛ | `am` |
| Arabic | العربية | `ar` |
| Armenian | Հայերեն | `hy` |
| Azerbaijani | Azərbaycan | `az` |
| Basque | Euskara | `eu` |
| Belarusian | Беларуская | `be` |
| Bengali | বাংলা | `bn` |
| Bosnian | Bosanski | `bs` |
| Bulgarian | Български | `bg` |
| Catalan | Català | `ca` |
| Cebuano | Cebuano | `ceb` |
| Chinese (Simplified) | 中文 (简体) | `zh-CN` |
| Chinese (Traditional) | 中文 (繁體) | `zh-TW` |
| Corsican | Corsu | `co` |
| Croatian | Hrvatski | `hr` |
| Czech | Čeština | `cs` |
| Danish | Dansk | `da` |
| Dutch | Nederlands | `nl` |
| English | English | `en` |
| Esperanto | Esperanto | `eo` |
| Estonian | Eesti | `et` |
| Finnish | Suomi | `fi` |
| French | Français | `fr` |
| Frisian | Frysk | `fy` |
| Galician | Galego | `gl` |
| Georgian | ქართული | `ka` |
| German | Deutsch | `de` |
| Greek | Ελληνικά | `el` |
| Gujarati | ગુજરાતી | `gu` |
| Haitian Creole | Kreyòl Ayisyen | `ht` |
| Hausa | Hausa | `ha` |
| Hawaiian | ʻŌlelo Hawaiʻi | `haw` |
| Hebrew | עברית | `iw` |
| Hindi | हिन्दी | `hi` |
| Hmong | Hmoob | `hmn` |
| Hungarian | Magyar | `hu` |
| Icelandic | Íslenska | `is` |
| Igbo | Igbo | `ig` |
| Indonesian | Bahasa Indonesia | `id` |
| Irish | Gaeilge | `ga` |
| Italian | Italiano | `it` |
| Japanese | 日本語 | `ja` |
| Javanese | Basa Jawa | `jw` |
| Kannada | ಕನ್ನಡ | `kn` |
| Kazakh | Қазақ | `kk` |
| Khmer | ខ្មែរ | `km` |
| Kinyarwanda | Kinyarwanda | `rw` |
| Korean | 한국어 | `ko` |
| Kurdish (Kurmanji) | Kurdî | `ku` |
| Kyrgyz | Кыргызча | `ky` |
| Lao | ລາວ | `lo` |
| Latin | Latina | `la` |
| Latvian | Latviešu | `lv` |
| Lithuanian | Lietuvių | `lt` |
| Luxembourgish | Lëtzebuergesch | `lb` |
| Macedonian | Македонски | `mk` |
| Malagasy | Malagasy | `mg` |
| Malay | Bahasa Melayu | `ms` |
| Malayalam | മലയാളം | `ml` |
| Maltese | Malti | `mt` |
| Maori | Māori | `mi` |
| Marathi | मराठी | `mr` |
| Mongolian | Монгол | `mn` |
| Myanmar (Burmese) | မြန်မာ | `my` |
| Nepali | नेपाली | `ne` |
| Norwegian | Norsk | `no` |
| Nyanja (Chichewa) | Chichewa | `ny` |
| Odia (Oriya) | ଓଡ଼ିଆ | `or` |
| Pashto | پښتو | `ps` |
| Persian | فارسی | `fa` |
| Polish | Polski | `pl` |
| Portuguese (Brazil) | Português (Brasil) | `pt` |
| Portuguese (Portugal) | Português (Portugal) | `pt-PT` |
| Punjabi | ਪੰਜਾਬੀ | `pa` |
| Romanian | Română | `ro` |
| Russian | Русский | `ru` |
| Samoan | Samoa | `sm` |
| Scots Gaelic | Gàidhlig | `gd` |
| Serbian | Српски | `sr` |
| Sesotho | Sesotho | `st` |
| Shona | Shona | `sn` |
| Sindhi | سنڌي | `sd` |
| Sinhala | සිංහල | `si` |
| Slovak | Slovenčina | `sk` |
| Slovenian | Slovenščina | `sl` |
| Somali | Soomaali | `so` |
| Spanish | Español | `es` |
| Sundanese | Basa Sunda | `su` |
| Swahili | Kiswahili | `sw` |
| Swedish | Svenska | `sv` |
| Tagalog (Filipino) | Tagalog | `tl` |
| Tajik | Тоҷикӣ | `tg` |
| Tamil | தமிழ் | `ta` |
| Tatar | Татар | `tt` |
| Telugu | తెలుగు | `te` |
| Thai | ไทย | `th` |
| Turkish | Türkçe | `tr` |
| Turkmen | Türkmençe | `tk` |
| Ukrainian | Українська | `uk` |
| Urdu | اردو | `ur` |
| Uyghur | ئۇيغۇر | `ug` |
| Uzbek | Oʻzbek | `uz` |
| Vietnamese | Tiếng Việt | `vi` |
| Welsh | Cymraeg | `cy` |
| Xhosa | isiXhosa | `xh` |
| Yiddish | ייִדיש | `yi` |
| Yoruba | Yorùbá | `yo` |
| Zulu | isiZulu | `zu` |
<!-- generated:languages:end -->

This table is generated from `src/core/languages.ts`, and a test fails if the two disagree.
