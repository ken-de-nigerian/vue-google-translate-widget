<script setup lang="ts">
// A language switcher in the docs navbar: the whole site is a live demo.
import { GoogleTranslateButton } from '../../../src'
</script>

<template>
  <ClientOnly>
    <GoogleTranslateButton
      class="nav-translate"
      :included-languages="['en', 'fr', 'de', 'es', 'pt', 'ar', 'yo', 'ig', 'ha', 'ja', 'zh-CN', 'hi']"
      display="both"
      show-flags
      flag-style="emoji"
      lazy>
      <template #default="{ current }">🌐 {{ current?.nativeName ?? 'Language' }}</template>
    </GoogleTranslateButton>
  </ClientOnly>
</template>

<style scoped>
.nav-translate {
  margin-inline-start: 12px;
  --gtw-color-bg: var(--vp-c-bg);
  --gtw-color-text: var(--vp-c-text-1);
  --gtw-color-border: var(--vp-c-divider);
  --gtw-color-surface: var(--vp-c-bg-soft);
  --gtw-color-surface-strong: var(--vp-c-bg-soft);
}
</style>
