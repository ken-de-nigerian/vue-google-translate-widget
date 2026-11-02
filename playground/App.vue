<script setup lang="ts">
import { GoogleTranslateButton, GoogleTranslateWidget } from '../src'

// ?scriptSrc=... simulates a blocked or broken Google script; ?mode=reload tests the 1.0 behaviour.
const params = new URLSearchParams(window.location.search)
const scriptSrc = params.get('scriptSrc') ?? undefined
const mode = params.get('mode') === 'reload' ? 'reload' : 'live'
const timeout = params.has('timeout') ? Number(params.get('timeout')) : undefined
</script>

<template>
  <main class="page">
    <header class="bar">
      <strong>Playground</strong>
      <GoogleTranslateButton
        :included-languages="['en', 'fr', 'de', 'ar', 'yo', 'he', 'jv']"
        :script-src="scriptSrc"
        :mode="mode"
        :timeout="timeout" />
    </header>

    <h1>Welcome to our website</h1>
    <p id="sample">
      This page is used to test the Google Translate widget against the real Google script. The quick brown fox jumps
      over the lazy dog.
    </p>
    <p>Product name that should not be translated: <span class="notranslate">PayZephyr</span></p>

    <GoogleTranslateWidget :script-src="scriptSrc" :mode="mode" :timeout="timeout" />
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
}
.bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
