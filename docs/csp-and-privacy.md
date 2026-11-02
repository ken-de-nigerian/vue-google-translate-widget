# CSP & Privacy

**Who this is for:** sites with a Content Security Policy, or with privacy and GDPR obligations. **At the end**
you'll know what to allow and what's sent where.

## Content Security Policy

With Google's widget (these are the hosts it used when tested on 2026-11-02; Google can change them, so check your
CSP reports after deploying):

```
script-src  'self' https://translate.google.com https://translate.googleapis.com 'nonce-…';
style-src   'self' https://www.gstatic.com 'nonce-…';
img-src     'self' https://www.gstatic.com https://www.google.com https://fonts.gstatic.com https://flagcdn.com;
connect-src 'self' https://translate.googleapis.com https://translate-pa.googleapis.com;
frame-src   https://translate.google.com;
```

Pass your nonce so the injected `<script>` and `<style>` are allowed:

```vue
<GoogleTranslateWidget :nonce="cspNonce" />
```

`flagcdn.com` is only needed with `show-flags` and the default `flagUrl`. To proxy Google's script, use `scriptSrc`.

With a provider: only `connect-src` for your endpoint (or your LibreTranslate server). Google is never contacted.

## What's sent where

| | Google widget | Provider |
| --- | --- | --- |
| Page text | to Google | to your server, then the service you chose |
| Cookies | `googtrans` (the chosen language) | `googtrans` (the chosen language) |
| `localStorage` | only with `rememberRecent` / `suggestBrowserLanguage` / `autoTranslate` | the same, plus the translation cache |
| Other requests | Google's script, styles and logging | none |

Machine translation sends your page's text to a third party. Mention it in your privacy policy, and keep personal
data out of translated areas (or mark them with `v-no-translate`). For no third parties at all, self-host
LibreTranslate.

## Blocked scripts

Ad and privacy blockers often block Google's widget. The components then show `errorText` and emit `error`, and
`status` becomes `'error'`. Nothing else breaks.
