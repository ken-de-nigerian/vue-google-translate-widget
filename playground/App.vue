<script setup lang="ts">
import { GoogleTranslateButton, GoogleTranslateWidget, vNoTranslate } from '../src'

// Every option can be set from the URL, e.g. ?theme=dark&position=bottom-right&flagStyle=emoji
const params = new URLSearchParams(window.location.search)
const get = (key: string) => params.get(key) ?? undefined
const list = (key: string) => params.get(key)?.split(',')

const options = {
  scriptSrc: get('scriptSrc'),
  mode: get('mode') === 'reload' ? ('reload' as const) : ('live' as const),
  timeout: params.has('timeout') ? Number(params.get('timeout')) : undefined,
  theme: (get('theme') ?? 'light') as 'light' | 'dark' | 'auto',
  unstyled: params.has('unstyled'),
  flagStyle: (get('flagStyle') ?? 'image') as 'image' | 'emoji',
  pinned: list('pinned'),
  rememberRecent: params.has('recent') ? Number(params.get('recent') || 3) : false,
  lazy: params.has('lazy'),
}
const position = (get('position') ?? 'bottom-left') as 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
const display = get('display') as 'native' | 'english' | 'both' | undefined
const suggest = params.has('suggest')
const dark = params.has('pageDark')
</script>

<template>
  <main :class="['page', { 'page-dark': dark }]">
    <header class="bar">
      <strong>Playground</strong>
      <GoogleTranslateButton
        v-bind="options"
        :display="display ?? 'native'"
        :included-languages="['en', 'fr', 'de', 'ar', 'yo', 'he', 'jv', 'cy', 'eo']" />
    </header>

    <h1>Welcome to our website</h1>
    <p id="sample">
      This page is used to test the Google Translate widget against the real Google script. The quick brown fox jumps
      over the lazy dog.
    </p>
    <p>Product name that should not be translated: <span v-no-translate>PayZephyr</span></p>

    <GoogleTranslateWidget
      v-bind="options"
      :position="position"
      :display="display ?? 'both'"
      :suggest-browser-language="suggest" />
  </main>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
}
.page {
  max-width: 48rem;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
}
.page-dark {
  background: #0b1120;
  color: #e5e7eb;
}
.bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
