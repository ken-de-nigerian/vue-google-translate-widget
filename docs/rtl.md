# Right-to-Left Languages

Arabic, Hebrew, Persian, Urdu, Pashto, Sindhi, Uyghur, Yiddish and Dhivehi are written from right to left. When a
page is shown in one of them, the whole layout should mirror: text aligns to the right, navigation starts on the
right, and arrows point the other way. If it doesn't, the translation is technically there but awkward to read.

## What the package does

While the page is shown in a right-to-left language, the package sets `dir="rtl"` on the `<html>` element. When the
visitor switches to a left-to-right language, or back to the original, it puts back whatever `dir` your page had (or
removes it, if it had none).

This is needed because Google's widget doesn't do it. Google adds a `translated-rtl` class to `<html>` and translates
the text, but leaves the direction alone, so an Arabic page keeps a left-to-right layout. The package watches for
that class and sets `dir` to match. The DOM engine used by [providers](providers.md) marks the page the same way, so
this works whichever engine is active.

If you manage `dir` yourself, turn this off:

```ts
createGoogleTranslate({ syncDocumentDir: false })
```

## What your CSS needs

With `dir="rtl"` on `<html>`, the browser mirrors a lot for you: text alignment, the order of flex items and grid
columns, and the side of scrollbars. What it can't mirror is CSS that names a side explicitly. `margin-left: 1rem`
means "left" in every language.

CSS logical properties name the start and end of a line instead, so they follow the direction:

| Instead of | Use |
| --- | --- |
| `margin-left`, `margin-right` | `margin-inline-start`, `margin-inline-end` |
| `padding-left`, `padding-right` | `padding-inline-start`, `padding-inline-end` |
| `left: 0`, `right: 0` | `inset-inline-start: 0`, `inset-inline-end: 0` |
| `text-align: left` | `text-align: start` |
| `border-left` | `border-inline-start` |

```css
/* Mirrors correctly in Arabic */
.recipe-card {
  padding-inline: 1.5rem;
  border-inline-start: 4px solid var(--brand);
  text-align: start;
}
```

Icons that show direction, like "next" arrows and chevrons, should flip too:

```css
[dir='rtl'] .icon-next {
  transform: scaleX(-1);
}
```

Tailwind has `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*` and `end-*` utilities for the same thing, plus an `rtl:`
variant.

## The package's own components

The components use logical properties where direction matters. The Button's dropdown, for example, lines up with the
end of the button, so it opens towards the page content in either direction. The floating widget stays in the corner
you chose with `position`; if you want it on the other side for right-to-left languages, set `position` based on
`currentLanguage`.

## Checking it

Switch your site to Arabic and look at each page type: navigation, forms, cards, tables, anything with an arrow.
Anything stuck on the wrong side is usually a `left`/`right` in your CSS.
