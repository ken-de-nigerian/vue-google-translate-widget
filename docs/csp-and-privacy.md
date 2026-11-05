# Security, CSP & Privacy

Adding translation means loading third-party code, or sending your page's text somewhere, or both. This chapter
covers what that means for your Content Security Policy, for your visitors' privacy, and, if you use a paid
translation service, for keeping your API key and your bill safe.

## Content Security Policy

A Content Security Policy tells the browser which sources a page may load scripts, styles and other resources from.
If your site has one, Google's widget is blocked until you allow it, and the switcher shows "Translation is
unavailable right now."

These are the hosts Google's widget used when tested on 2 November 2026. Google can change them, so watch your CSP
violation reports after deploying:

```
script-src  'self' https://translate.google.com https://translate.googleapis.com 'nonce-…';
style-src   'self' https://www.gstatic.com 'nonce-…';
img-src     'self' https://www.gstatic.com https://www.google.com https://fonts.gstatic.com;
connect-src 'self' https://translate.googleapis.com https://translate-pa.googleapis.com;
frame-src   https://translate.google.com;
```

The package injects one `<script>` (Google's) and one `<style>` (the rules that hide Google's branding). If your
policy uses nonces, pass yours so both are allowed:

```ts
createGoogleTranslate({ nonce: cspNonce })
```

Add `https://flagcdn.com` to `img-src` only if you use `show-flags` with the default image flags.

To serve Google's script through your own domain, for example via a proxy, set `scriptSrc`.

**With a [provider](providers.md)**, Google's script is never loaded. You only need `connect-src` for your own
translation endpoint (or your LibreTranslate server).

## What's sent where {#whats-sent-where}

| | Google's widget (default) | A provider |
| --- | --- | --- |
| Your page's text | To Google, when a visitor picks a language | To your server, then the service you chose |
| Cookies set | `googtrans` (the chosen language) | `googtrans` (the chosen language) |
| `localStorage` | Only with `remember-recent`, `suggest-browser-language` or `autoTranslate` | The same, plus the translation cache |
| Other requests | Google's script, styles, images and logging | None |

Two things follow from this.

- **Mention it in your privacy policy.** Machine translation sends the visible text of the page to a translation
  service. With Google's widget, that's Google. Your legal team will know whether your jurisdiction needs consent for
  it.
- **Keep personal data out of translation.** Text that shows a signed-in visitor's name, address or order details
  is sent along with everything else. Mark those areas with [`v-no-translate`](directive.md). It keeps them out of
  the request as well as unchanged on the page.

If no third party may see your content at all, self-host [LibreTranslate](providers.md#libretranslate-straight-from-the-browser).

## Protecting your translation endpoint {#protecting-your-translation-endpoint}

If you use a paid service through [Server Handlers](server-handlers.md), your translation endpoint is a public URL
that spends money. `createTranslateHandler` already:

- keeps your API key on the server;
- rejects requests that aren't `POST`, aren't valid JSON, or contain anything other than strings and language codes;
- caps the size of each request with `maxTexts` and `maxCharacters`;
- can refuse languages you don't offer, with `allowedTargets`;
- never sends the service's error messages to the browser, since they can contain quota details or parts of your key.

It doesn't rate-limit, because the right limit depends on your traffic and infrastructure. For a public site, add it:

- **Per-IP rate limiting** at your edge (Cloudflare, your load balancer) or in the route itself.
- **A spending cap** in the translation service's dashboard. DeepL, Google Cloud and Azure all let you set a monthly
  limit or budget alert.
- **Same-origin only.** The provider sends requests with `credentials: 'same-origin'`; don't add permissive CORS
  headers to the route.

## Blocked scripts

Ad blockers and privacy extensions often block Google's widget. When they do, `status` becomes `'error'`, the
components show their "translation unavailable" message and emit `error`, and the rest of your page carries on
normally. If a large share of your visitors block Google, that's a good reason to use a provider instead.

## Reporting a vulnerability

Please don't open a public issue. See [SECURITY.md](https://github.com/ken-de-nigerian/vue-google-translate-widget/blob/main/SECURITY.md)
for how to report it privately.
