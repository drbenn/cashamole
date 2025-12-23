import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['./app/assets/css/main.css'],
  modules: [
    '@nuxt/hints',
    '@nuxt/image',
    '@nuxt/eslint',
    'shadcn-nuxt',
    '@pinia/nuxt',
  ],
  alias: {
    '@/': './app',
    '@common-types': new URL('../server/common-types', import.meta.url).pathname
  },
  vite: {
    plugins: [
      tailwindcss()
    ]
  },
  shadcn: {
    /**
     * Prefix for all the imported component.
     * @default "Ui"
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * Will respect the Nuxt aliases.
     * @link https://nuxt.com/docs/api/nuxt-config#alias
     * @default "@/components/ui"
     */
    componentDir: '@/components/ui'
  },
  runtimeConfig: {
    // Keys defined here are PRIVATE (server-side only)
    // apiSecret: '', // can be overridden by NUXT_API_SECRET environment variable
    // Keys defined here are PUBLIC (server AND client-side)
    public: {
      apiBaseUrl: '', // can be overridden by NUXT_PUBLIC_API_BASE environment variable
    },
  },
  // dev server for running build locally
  devServer: {
    port: 4200, // <--- Set your desired port here
    host: 'localhost', // Optional: '0.0.0.0' to allow external access
  },
  routeRules: {
    '/': { prerender: true },
    // '/about': { prerender: true },
    // '/blog/**': { prerender: true },
    // This tells Nuxt: "Do not attempt to prerender these routes during build."
    // They will only run in the client's browser after loading.
    '/dashboard/**': { ssr: false },

    // Example of a single protected page:
    // '/profile': { ssr: false },
  },
})