# Theming

**Who this is for:** anyone matching the components to their design. **At the end** you'll change colours with a
few CSS variables, or take over the styling completely.

## Light, dark, or automatic

```vue
<GoogleTranslateWidget theme="dark" />
```

| `theme` | |
| --- | --- |
| `'auto'` (default) | Dark under `<html class="dark">` (the Tailwind convention); light under `<html class="light">`; otherwise follows the OS setting |
| `'light'` / `'dark'` | Always that |

## CSS custom properties

Set any of these on `:root` (or any ancestor). They apply to both components and both themes. To change only dark
mode, scope them under your own dark selector (`html.dark { … }`).

```css
:root {
  --gtw-color-primary: #16a34a;
  --gtw-color-primary-hover: #15803d;
  --gtw-radius: 0.5rem;
  --gtw-font: 'Inter', sans-serif;
}
```

| Property | Light default | Used for |
| --- | --- | --- |
| `--gtw-color-primary` | `#3b82f6` | Floating button, active border, focus rings |
| `--gtw-color-primary-hover` | `#2563eb` | Hover |
| `--gtw-color-primary-text` | `#2563eb` | Text of the current language |
| `--gtw-color-on-primary` | `#ffffff` | Icons on the primary colour |
| `--gtw-color-bg` | `#ffffff` | Panels |
| `--gtw-color-text` | `#111827` | Text |
| `--gtw-color-text-muted` | `#4b5563` | Secondary text |
| `--gtw-color-text-subtle` | `#9ca3af` | Icons |
| `--gtw-color-surface` | `#f9fafb` | Hover background |
| `--gtw-color-surface-strong` | `#f3f4f6` | Badges, list hover |
| `--gtw-color-border` | `#e5e7eb` | Borders |
| `--gtw-color-border-strong` | `#d1d5db` | Hover borders |
| `--gtw-color-active-bg` | `rgba(59,130,246,.08)` | Current language |
| `--gtw-color-overlay` | `rgba(0,0,0,.5)` | Modal backdrop |
| `--gtw-color-error-bg` | `#fef2f2` | Error message |
| `--gtw-color-error-text` | `#991b1b` | Error message |
| `--gtw-radius` | `1rem` | Modal corners |
| `--gtw-shadow` | soft shadow | Modal and prompt |
| `--gtw-font` | system UI | Font |
| `--gtw-z-index` | `9999` | Floating button (the modal sits one above) |
| `--gtw-offset` | `1rem` / `1.5rem` | Floating button distance from its corner |

## Overriding individual rules

Every rule is scoped (Vue adds a `[data-v-…]` attribute) and wrapped in `:where(.gtw-styled)`, which adds no
specificity of its own. A rule like `.gtw-modal` therefore has the specificity of two classes, so override it with
two classes of your own:

```css
.my-site .gtw-modal {
  border-radius: 0;
}
```

The class names are listed in the [API Reference](./api-reference.md#css-classes).

## Starting from scratch

```vue
<GoogleTranslateButton unstyled class="my-switcher" />
```

`unstyled` turns every style off (except the screen-reader-only helper). The markup, classes, ARIA and keyboard
support stay, so it works well with Tailwind or UnoCSS. You can also skip importing `style.css` altogether if every
instance is unstyled.

## Your own markup

For a different structure, use the [slots](./widget.md#slots), or build your own UI on
[the composable](./composable.md).
