# Right-to-Left Languages

**Who this is for:** sites offering Arabic, Hebrew, Persian, Urdu, Pashto, Sindhi, Uyghur, Yiddish or Dhivehi.
**At the end** you'll know what the package does for RTL, and what your CSS needs.

When the page is shown in a right-to-left language, the package sets `<html dir="rtl">`, and puts back the page's
own `dir` afterwards. Google's widget only adds a `translated-rtl` class, which on its own leaves your layout
left-to-right. Both engines are handled.

Turn it off with `syncDocumentDir: false` if you manage `dir` yourself.

## Your CSS

With `dir="rtl"`, flexbox and grid flip automatically. Margins, padding and positions written as `left`/`right`
don't. Logical properties do:

```css
/* flips in RTL */
.card { margin-inline-start: 1rem; padding-inline: 1rem; inset-inline-end: 0; text-align: start; }
```

The package's own components use logical properties where it matters (e.g. the Button's dropdown aligns to the
button's end in either direction).
