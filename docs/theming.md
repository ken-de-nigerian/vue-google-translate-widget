# Theming

The components come with a clean, neutral look so they work on most sites out of the box. This chapter covers the
four ways to make them match yours, from lightest to heaviest: picking a theme, setting a few CSS custom properties,
overriding individual rules, and turning the styles off entirely.

## Light, dark or automatic

```vue
<GoogleTranslateWidget theme="dark" />
```

| `theme` | |
| --- | --- |
| `'auto'` (the default) | Dark when `<html>` has the `dark` class, light when it has the `light` class, and otherwise whatever the visitor's operating system is set to |
| `'light'` | Always light |
| `'dark'` | Always dark |

The `html.dark` / `html.light` convention is the one Tailwind, VitePress, Nuxt Color Mode and most dark-mode toggles
use, so `'auto'` usually follows your site's own toggle without any wiring.

## Your colours with CSS custom properties

Lagos Eats has a warm orange brand colour and square corners. Two lines of CSS cover it:

```css
:root {
  --gtw-color-primary: #c2410c;
  --gtw-color-primary-hover: #9a3412;
  --gtw-color-primary-text: #9a3412;
  --gtw-radius: 0.25rem;
}
```

These properties apply to both components in both themes. To change only the dark theme, set them under your dark
selector:

```css
html.dark {
  --gtw-color-primary: #fb923c;
  --gtw-color-bg: #1c1917;
}
```

| Property | Light default | What it colours |
| --- | --- | --- |
| `--gtw-color-primary` | `#2563eb` | The floating button, the current language's border, focus rings |
| `--gtw-color-primary-hover` | `#1d4ed8` | Hover states of the above |
| `--gtw-color-primary-text` | `#2563eb` | The current language's name |
| `--gtw-color-on-primary` | `#ffffff` | Icons on the primary colour |
| `--gtw-color-bg` | `#ffffff` | Dialog, dropdown and prompt backgrounds |
| `--gtw-color-text` | `#111827` | Main text |
| `--gtw-color-text-muted` | `#4b5563` | Secondary text, like English names under native names |
| `--gtw-color-text-subtle` | `#9ca3af` | Icons |
| `--gtw-color-surface` | `#f9fafb` | Hovered list items |
| `--gtw-color-surface-strong` | `#f3f4f6` | Language-code badges, the dropdown's hover |
| `--gtw-color-border` | `#e5e7eb` | Borders |
| `--gtw-color-border-strong` | `#d1d5db` | Borders on hover |
| `--gtw-color-active-bg` | `rgba(59, 130, 246, 0.08)` | Background of the current language |
| `--gtw-color-overlay` | `rgba(0, 0, 0, 0.5)` | The backdrop behind the dialog |
| `--gtw-color-error-bg` | `#fef2f2` | The "translation unavailable" message |
| `--gtw-color-error-text` | `#991b1b` | Its text |
| `--gtw-radius` | `1rem` | The dialog's corners |
| `--gtw-shadow` | a soft shadow | The dialog and prompt |
| `--gtw-font` | the system UI font stack | Everything |
| `--gtw-z-index` | `9999` | The floating button; the dialog sits one above it |
| `--gtw-offset` | `1rem`, `1.5rem` from 768px | The floating button's distance from its corner |

If you change colours, keep text at a contrast of 4.5:1 or more against its background (3:1 for icons). The
defaults meet WCAG AA in the light, dark and automatic themes; a test in CI reads the real defaults and checks every
pair, so they can't regress.

## Overriding individual rules

For anything the custom properties don't cover, target the components' classes. Every rule is scoped to the
component (Vue adds a `[data-v-…]` attribute) and wrapped in `:where(.gtw-styled)`, which adds no specificity of its
own. A rule like `.gtw-modal` therefore has the specificity of two classes, and you need two classes to beat it:

```css
.lagos-eats .gtw-modal {
  max-width: 24rem;
}
```

All class names are listed in the [API Reference](api-reference.md#css-classes). They're part of the public API: a
change to them is treated as a breaking change.

## Starting from scratch {#starting-from-scratch}

```vue
<GoogleTranslateButton unstyled class="language-switcher" />
```

`unstyled` turns every style off except the one that hides screen-reader-only text visually. The markup, class names,
ARIA attributes and keyboard handling all stay, which makes it a good starting point with Tailwind or UnoCSS. If every
component in your app is unstyled, you can skip importing `style.css`.

For a different structure rather than a different look, use the [slots](widget.md#replacing-parts-of-it), or build
your own switcher on [the composable](composable.md).
