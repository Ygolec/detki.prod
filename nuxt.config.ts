// https://nuxt.com/docs/api/configuration/nuxt-config
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    directusUrl: process.env.DIRECTUS_INTERNAL_URL || process.env.DIRECTUS_PUBLIC_URL || process.env.NUXT_DIRECTUS_URL || 'http://directus:8055',
    directusToken: process.env.DIRECTUS_STATIC_TOKEN || process.env.NUXT_DIRECTUS_TOKEN || '',
    public: {
      directusUrl: process.env.DIRECTUS_PUBLIC_URL || process.env.NUXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055',
      directusToken: process.env.NUXT_PUBLIC_DIRECTUS_TOKEN || '',
    },
  },
  build: {
    transpile: ['vuetify'],
  },
  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        // @ts-expect-error
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
    //...
  ],
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
})
