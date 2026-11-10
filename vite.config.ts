import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import solid from 'vite-plugin-solid';

// The table colour. Keep the same value in index.html and src/ui/styles.css.
const TABLE = '#2F6F4E';

export default defineConfig({
  // GitHub Pages serves the app from https://<user>.github.io/pile-pals/.
  base: '/pile-pals/',
  plugins: [
    solid(),
    VitePWA({
      // The code, not the Child, accepts an update (spec, Module 9 Shell).
      registerType: 'prompt',
      injectRegister: false,
      pwaAssets: { image: 'public/icon.svg', preset: 'minimal-2023' },
      manifest: {
        name: 'Pile Pals',
        short_name: 'Pile Pals',
        display: 'standalone',
        background_color: TABLE,
        theme_color: TABLE,
      },
      // webp and avif: the card pictures and the animation loops in public/ (research/content/build_content.py).
      // txt: their licence and credit files. Each file is less than the default limit of 2 MiB
      // (maximumFileSizeToCacheInBytes), so the precache holds all of them.
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,webp,avif,txt,webmanifest}'] },
    }),
  ],
});
