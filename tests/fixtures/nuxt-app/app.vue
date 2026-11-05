<script setup lang="ts">
const { currentLanguage } = useGoogleTranslate()
</script>

<template>
  <main>
    <h1>Welcome to our website</h1>
    <p>Brand: <span v-no-translate class="brand">PayZephyr</span></p>
    <p class="current">Current: {{ currentLanguage }}</p>
    <GoogleTranslateButton>
      <template #default="{ current }">
        <span class="label">{{ current?.nativeName }}</span>
      </template>
    </GoogleTranslateButton>
    <GoogleTranslateWidget />
  </main>
</template>
