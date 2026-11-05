# Accessibility

A language switcher exists for people who can't read your site as it is, so it has to work for everyone, including
people who navigate by keyboard, use a screen reader, or zoom the page. This chapter describes what the components
guarantee, how that's tested, and what's still up to you.

## What the components do

Both components follow the WAI-ARIA Authoring Practices: the widget is a [modal
dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) containing a
[combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) and
[listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/); the button opens a listbox.

**Names and roles.** Every interactive element has an accessible name. The floating button is "Change language" and
announces that it opens a dialog and whether it's open. The dialog is labelled by its title. The list is a listbox of
options, and the current language is marked as selected.

**Keyboard.** Everything works without a mouse:

| Key | Widget (search box focused) | Button (list focused) |
| --- | --- | --- |
| **↓** / **↑** | Move through the results | Open the list, then move through it |
| **Home** / **End** | First / last result | First / last language |
| **Enter** | Choose | Choose |
| **Space** | Types a space | Choose |
| **Esc** | Close, and return focus to the button | Close, and return focus to the button |
| **Tab** | Stays inside the dialog | Closes the list and moves on |

**Focus.** Opening the widget moves focus to the search box; closing it returns focus to the button that opened it.
Focus can't leave the dialog with Tab while it's open. After choosing a language, focus returns to the button, which
is marked `aria-disabled` rather than `disabled` while the page is translated, because a disabled button can't hold
focus. Focused items have a visible outline.

**Announcements.** As the visitor types in the search box, the number of matching languages is announced in a polite
live region. The "translation unavailable" message uses `role="alert"`.

**Language names.** Each language is listed under its own name, which is never machine-translated, so a reader can
always find their language whatever language the page is currently in.

**Motion and contrast.** Transitions are turned off for visitors who ask for reduced motion. The default colours meet
WCAG AA contrast in the light, dark and automatic themes: 4.5:1 for text and 3:1 for icons.

## How it's tested

- **axe-core** runs against both components, open, in CI, and must report no violations. (Colour contrast needs real
  rendering, so it's tested separately, below.)
- **Keyboard and focus behaviour** (every key in the table, focus trapping, focus return, the live region) is covered
  by component tests.
- **Contrast** is tested by reading the real default colours from the stylesheet and checking every text and
  background pair against WCAG AA, in all three themes.
- The components have also been used with a keyboard against the real Google script in a browser.

Automated tools find many problems but not all of them. If you find something that doesn't work with your assistive
technology, please [open an issue](https://github.com/ken-de-nigerian/vue-google-translate-widget/issues).

## What's up to you

- **Your colours.** If you change the theme's custom properties, keep text at 4.5:1 against its background and icons
  at 3:1. See [Theming](theming.md).
- **Your own switcher.** If you build one on [the composable](composable.md), you're responsible for its semantics.
  Use real `<button>`s, mark the current language (`aria-pressed` or `aria-current`), and put `v-no-translate` on
  language names.
- **Labels in your language.** If your site isn't in English, translate the screen-reader text with the widget's
  [`labels`](widget.md#changing-the-words), not just the visible title.
- **The translated page.** Machine translation can produce text that's harder to read than the original. For content
  where that matters, like health, legal or safety information, consider a human translation, and tell readers when
  they're reading a machine translation (see the notice example in
  [Events & Analytics](events-and-analytics.md#reacting-to-the-language-in-code)).
- **`lang` and `dir`.** The package keeps `<html lang>` and `dir` in step with the translation, so screen readers use
  the right voice and the layout mirrors for right-to-left languages. If you turn off `syncDocumentDir`, that becomes
  your job.
