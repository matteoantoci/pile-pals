import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import solid from 'vite-plugin-solid';

// The table colour. Keep the same value in index.html and src/ui/styles.css.
const TABLE = '#2F6F4E';

export default defineConfig({
  // GitHub Pages serves the app from https://<user>.github.io/pile-pals/.
  base: '/pile-pals/',
  build: {
    rolldownOptions: {
      // The listening page /listen/ of ticket 05 is a second page. Its code goes to listen/, out of the precache.
      input: { index: 'index.html', listen: 'listen/index.html' },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'listen' ? 'listen/[name]-[hash].js' : 'assets/[name]-[hash].js'),
      },
    },
  },
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
      workbox: {
        // wav: the shipped sounds (public/sounds/). webp and avif: the card pictures and the animation
        // loops of public/ (research/content/build_content.py). txt: their licence and credit files.
        // Each file is below the default limit of 2 MiB (maximumFileSizeToCacheInBytes), so the precache
        // holds all of them.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,avif,txt,webmanifest,wav}'],
        // The listening page and its clips (public/listen/) are only for the Parent: no precache,
        // and no fallback to the game page for a navigation to /listen/.
        globIgnores: ['listen/**'],
        navigateFallbackDenylist: [/\/listen\//],
      },
    }),
  ],
});
