<script setup lang="ts">
import { computed } from 'vue'
import { flagEmoji, type FlagStyle } from './shared'

// Internal. Renders a single root element, so the parent's scoped CSS (its
// `prefix-flag` class) applies to whichever variant is shown.
const props = defineProps<{
  flag: string
  code: string
  flagStyle: FlagStyle
  flagUrl: (flag: string) => string
  prefix: 'gtw' | 'gtb'
}>()

const emoji = computed(() => (props.flagStyle === 'emoji' && props.flag ? flagEmoji(props.flag) : ''))
</script>

<template>
  <img
    v-if="flagStyle === 'image' && flag"
    :src="flagUrl(flag)"
    alt=""
    loading="lazy"
    @error="(e: Event) => ((e.target as HTMLImageElement).style.visibility = 'hidden')" />
  <span v-else-if="emoji" :class="`${prefix}-flag-emoji`" aria-hidden="true">{{ emoji }}</span>
  <span v-else :class="`${prefix}-flag-code notranslate`" translate="no" aria-hidden="true">{{ code }}</span>
</template>
