# Live vs Reload

**Who this is for:** anyone whose app reacts badly to the DOM being changed underneath it, or who's upgrading from
1.0. **At the end** you'll know when to use `mode: 'reload'`.

| `mode` | What happens |
| --- | --- |
| `'live'` (default) | The page is translated in place. No reload, no lost state. |
| `'reload'` | The choice is saved, and the page reloads already translated: the 1.0 behaviour. |

Live mode is right for almost every site. Machine translation rewrites text nodes, and Vue copes with that well.
When Vue re-renders a translated element, the provider engine translates the new text, and Google's widget does
the same for most changes.

Consider `'reload'` if:

- a third-party widget on your page breaks when its text changes, or
- you prefer every page view to start from a clean, already-translated render.

Restoring the original language is also done in place (via Google's "Show original" button, or the provider
engine's stored originals). Set `reloadOnRestore: true` to reload instead.
