// Nuxt provides '#imports' to runtime plugins; this declares the parts we use for type-checking.
declare module '#imports' {
  export { defineNuxtPlugin, useCookie, useRoute, useRuntimeConfig } from 'nuxt/app'
}
