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
            { text: 'Quick Start', link: '/quick-start' },
            { text: 'Nuxt', link: '/nuxt' },
            { text: 'How It Works', link: '/how-it-works' },
          ],
        },
        {
          text: 'Components and API',
          items: [
            { text: 'GoogleTranslateWidget', link: '/widget' },
            { text: 'GoogleTranslateButton', link: '/button' },
            { text: 'useGoogleTranslate', link: '/composable' },
            { text: 'Plugin', link: '/plugin' },
            { text: 'v-no-translate', link: '/directive' },
          ],
        },
        {
          text: 'Customising',
          items: [
            { text: 'Theming', link: '/theming' },
            { text: 'Languages & Flags', link: '/languages' },
            { text: 'Right-to-Left', link: '/rtl' },
          ],
        },
        {
          text: 'Behaviour',
          items: [
            { text: 'Live vs Reload', link: '/live-vs-reload' },
            { text: 'Events & Analytics', link: '/events-and-analytics' },
          ],
        },
        {
          text: 'Going further',
          items: [
            { text: 'Translation Providers', link: '/providers' },
            { text: 'Server Handlers', link: '/server-handlers' },
          ],
        },
        {
          text: 'Shipping it',
          items: [
            { text: 'Performance', link: '/performance' },
            { text: 'CSP & Privacy', link: '/csp-and-privacy' },
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
