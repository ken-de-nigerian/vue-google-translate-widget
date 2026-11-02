# Languages & Flags

**Who this is for:** anyone choosing which languages to offer and how they look. **At the end** you'll know the
codes, the ordering options and the flag styles.

## Choosing languages

```vue
<GoogleTranslateWidget :included-languages="['en', 'fr', 'de', 'yo', 'ig', 'ha']" />
```

Or pass your own list (any of the 110 built in, or any code Google supports):

```ts
import { DEFAULT_LANGUAGES, type Language } from '@ken_de_nigerian/vue-google-translate-widget'

const languages: Language[] = [
  ...DEFAULT_LANGUAGES.filter(l => ['en', 'fr'].includes(l.code)),
  { name: 'Twi', nativeName: 'Twi', code: 'ak', flag: 'gh' },
]
```

Both props are reactive.

## Codes

Codes are Google's. Two are unusual: **`iw`** for Hebrew and **`jw`** for Javanese. The built-in list uses those, and
`he` / `jv` are accepted everywhere (`includedLanguages`, `pinned`, `changeLanguage`, `?lang=`) and converted for
you.

Every built-in code is checked against Google's live widget: a snapshot of its list is tested in CI, and a weekly job
compares the snapshot with the real widget. Google offers 248 languages; the built-in list covers 110, with
native names. Add others with the `languages` prop.

## Order and display

```vue
<GoogleTranslateWidget :pinned="['fr', 'de']" :remember-recent="3" display="native" />
```

- `pinned`: listed first, in that order.
- `rememberRecent`: the visitor's recent choices (kept in `localStorage`) come next. `true` keeps 3.
- `display`: `'native'` ("Deutsch"), `'english'` ("German") or `'both'`. Native names are never machine-translated.

## Flags

Flags are **off by default** in 2.0. A language isn't a country, and flag images are extra requests.

```vue
<GoogleTranslateWidget show-flags />                       <!-- images from flagcdn.com -->
<GoogleTranslateWidget show-flags flag-style="emoji" />    <!-- no requests -->
<GoogleTranslateWidget show-flags :flag-url="f => `/flags/${f}.svg`" />  <!-- self-hosted -->
```

Where a flag would be contested or doesn't exist, a small code badge is shown instead (Esperanto, Kurdish).
Catalan, Basque and Galician use their regional flags. Set `flag: ''` on your own languages to show the badge.

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

This table is generated from `src/core/languages.ts`; a test fails if they drift.
