# Live and Reload Modes

By default, translation happens **live**: the visitor picks a language and the text on the page changes in place.
There's no reload, so nothing the visitor was doing is lost: a half-filled form, a playing video, a scroll position,
an open accordion. That's the right behaviour for almost every site.

The alternative is **reload** mode, which is how 1.0 always behaved: the choice is saved, and the page reloads,
already translated.

```ts
createGoogleTranslate({ mode: 'reload' })
```

| `mode` | When the visitor picks a language |
| --- | --- |
| `'live'` (default) | The page's text is translated in place |
| `'reload'` | The choice is saved and the page reloads, translated from the first paint |

## When reload mode makes sense

Translation rewrites the text in your page's DOM. Vue handles that well: when it re-renders an element, the new
text is translated in turn. Some code is less forgiving, though, and reload mode is the escape hatch for it:

- A third-party widget (a chat bubble, a map, a booking embed) that breaks when the text inside it changes.
- An app that reads text back out of the DOM and does something with it, and gets confused when it's in another
  language.
- A preference for every page view starting from a clean, already-translated render.

Before reaching for reload mode, try marking the troublesome element with [`v-no-translate`](directive.md): if the
widget doesn't need translating, that's usually enough.

## Restoring the original

Going back to the page's own language is also done in place in live mode. With Google's widget, the package clicks
Google's "Show original" button; with a [provider](providers.md), the DOM engine puts back the original text it kept.
If Google's button can't be found, the page reloads instead.

To always reload when restoring, even in live mode:

```ts
createGoogleTranslate({ reloadOnRestore: true })
```
