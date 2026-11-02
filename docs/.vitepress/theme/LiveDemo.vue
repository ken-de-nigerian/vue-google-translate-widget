<script setup lang="ts">
// The real package, running against Google's real widget: everything on the page gets translated.
import { GoogleTranslateButton, vNoTranslate } from '../../../src'
import '../../../src/styles/tokens.css'
</script>

<template>
  <div class="demo">
    <p class="demo-hint">Pick a language: this whole page is translated in place, no reload.</p>
    <GoogleTranslateButton
      :included-languages="['en', 'fr', 'de', 'es', 'ar', 'yo', 'ja', 'zh-CN']"
      display="both"
      show-flags
      flag-style="emoji"
      theme="auto" />
    <p class="demo-note">Brand names stay as they are: <strong v-no-translate>Vue Google Translate Widget</strong>.</p>
  </div>
</template>

<style scoped>
.demo {
  margin: 1.5rem 0;
  padding: 1.25rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
.demo-hint,
.demo-note {
  margin: 0 0 0.75rem;
}
.demo-note {
  margin: 0.75rem 0 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}
</style>
