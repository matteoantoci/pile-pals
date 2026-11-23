import { minimal2023Preset, type Preset } from '@vite-pwa/assets-generator/config';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import solid from 'vite-plugin-solid';

// The top colour of the table. Keep the same value in index.html, scripts/shell/splash.py, and src/ui/styles.css.
const TABLE = '#08813A';

// The apple and maskable icons fill the whole square with the table colour. The minimal-2023 defaults
// add 30 % white padding, and iOS shows it as a white frame (docs/research/native-feel/app-icons.md).
// resizeOptions replaces the whole default object, so fit must be given again.
const fullBleed = { padding: 0, resizeOptions: { fit: 'contain', background: TABLE } } as const;
const iconPreset = {
  ...minimal2023Preset,
  maskable: { ...minimal2023Preset.maskable, ...fullBleed },
  apple: { ...minimal2023Preset.apple, ...fullBleed },
} satisfies Preset;

export default defineConfig({
  // GitHub Pages serves the app from https://<user>.github.io/pile-pals/.
  base: '/pile-pals/',
  plugins: [
    solid(),
    VitePWA({
      // The code, not the Child, accepts an update (spec, Module 9 Shell).
      registerType: 'prompt',
      injectRegister: false,
      pwaAssets: { image: 'public/icon.svg', preset: iconPreset },
      manifest: {
        name: 'Pile Pals',
        short_name: 'Pile Pals',
        display: 'standalone',
        background_color: TABLE,
        theme_color: TABLE,
      },
      workbox: {
        // wav: the shipped sounds (public/sounds/). webp and avif: the card pictures and the animation
        // loops of public/ (docs/research/content/build_content.py). txt: their licence and credit files.
        // Each file is below the default limit of 2 MiB (maximumFileSizeToCacheInBytes), so the precache
        // holds all of them.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,avif,txt,webmanifest,wav}'],
      },
    }),
  ],
});
