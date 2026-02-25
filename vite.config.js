import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
// IMPORTANTE: cambia `base` al nombre de tu repositorio en GitHub.
export default defineConfig({
  plugins: [svelte()],
  base: '/banco-preguntas/',
})
