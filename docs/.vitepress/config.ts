import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

const repo = 'https://github.com/ken-de-nigerian/vue-google-translate-widget'

export default withMermaid(
  defineConfig({
    title: 'Vue Google Translate Widget',
    description: 'Translate any Vue or Nuxt site into 100+ languages, in place, with an accessible language switcher.',
    base: '/vue-google-translate-widget/',
    cleanUrls: true,
    lastUpdated: true,
    srcExclude: ['README.md'],
    head: [['meta', { name: 'theme-color', content: '#3b82f6' }]],
    themeConfig: {
      nav: [
        { text: 'Guide', link: '/quick-start' },
        { text: 'API', link: '/api-reference' },
        { text: 'Changelog', link: '/changelog' },
        { text: 'npm', link: 'https://www.npmjs.com/package/@ken_de_nigerian/vue-google-translate-widget' },
      ],
      sidebar: [
        {
          text: 'Getting started',
          items: [
            { text: 'Installation', link: '/installation' },
            { text: 'Your First Language Switcher', link: '/quick-start' },
            { text: 'How Translation Works', link: '/how-it-works' },
            { text: 'Nuxt', link: '/nuxt' },
          ],
        },
        {
          text: 'Using the package',
          items: [
            { text: 'GoogleTranslateWidget', link: '/widget' },
            { text: 'GoogleTranslateButton', link: '/button' },
            { text: 'Building Your Own Switcher', link: '/composable' },
            { text: 'Configuration', link: '/plugin' },
            { text: 'Keeping Text Untranslated', link: '/directive' },
          ],
        },
        {
          text: 'Customising',
          items: [
            { text: 'Theming', link: '/theming' },
            { text: 'Languages & Flags', link: '/languages' },
            { text: 'Right-to-Left Languages', link: '/rtl' },
          ],
        },
        {
          text: 'Behaviour',
          items: [
            { text: 'Live and Reload Modes', link: '/live-vs-reload' },
            { text: 'Events & Analytics', link: '/events-and-analytics' },
          ],
        },
        {
          text: 'Going further',
          items: [
            { text: 'Translation Providers', link: '/providers' },
            { text: 'Server Handlers', link: '/server-handlers' },
            { text: 'Testing Your App', link: '/testing' },
          ],
        },
        {
          text: 'Shipping it',
          items: [
            { text: 'Performance', link: '/performance' },
            { text: 'Accessibility', link: '/accessibility' },
            { text: 'Security, CSP & Privacy', link: '/csp-and-privacy' },
            { text: 'Production Checklist', link: '/production-checklist' },
          ],
        },
        {
          text: 'When things go wrong',
          items: [
            { text: 'Troubleshooting', link: '/troubleshooting' },
            { text: 'FAQ', link: '/faq' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'API Reference', link: '/api-reference' },
            { text: 'Architecture', link: '/architecture' },
            {
              text: 'Decision records',
              collapsed: true,
              items: [
                {
                  text: 'ADR 0001: One translator per page, shared by every component',
                  link: '/architecture/adr/0001-one-translator-per-page',
                },
                {
                  text: "ADR 0002: Translate in place by driving Google's hidden language selector",
                  link: '/architecture/adr/0002-drive-googles-default-layout',
                },
                {
                  text: 'ADR 0003: The googtrans cookie is the source of truth for the chosen language',
                  link: '/architecture/adr/0003-cookie-is-the-source-of-truth',
                },
                {
                  text: 'ADR 0004: A DOM engine for providers, with API keys kept on the server',
                  link: '/architecture/adr/0004-provider-engine',
                },
                {
                  text: 'ADR 0005: One package with subpath exports, not a monorepo',
                  link: '/architecture/adr/0005-single-package-with-subpath-exports',
                },
                {
                  text: 'ADR 0006: No hreflang tags or /fr/ URL prefixes',
                  link: '/architecture/adr/0006-no-hreflang-or-path-prefixes',
                },
                { text: 'ADR 0007: Flags off by default', link: '/architecture/adr/0007-flags-off-by-default' },
                {
                  text: 'ADR 0008: Stay on TypeScript 6 until the tooling supports TypeScript 7',
                  link: '/architecture/adr/0008-typescript-7-deferred',
                },
              ],
            },
            { text: 'Upgrade Guide', link: '/upgrade-guide' },
            { text: 'Changelog', link: '/changelog' },
            { text: 'Contributing', link: '/contributing' },
          ],
        },
      ],
      socialLinks: [{ icon: 'github', link: repo }],
      editLink: { pattern: `${repo}/edit/main/docs/:path`, text: 'Edit this page on GitHub' },
      search: { provider: 'local' },
      footer: {
        message: 'Released under the MIT License.',
        copyright: 'Built for the Vue community by <a href="https://github.com/ken-de-nigerian">Ken De Nigerian</a>',
      },
    },
  }),
)
