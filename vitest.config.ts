import { defineConfig } from 'vitest/config';

// Tests cover only the game model, which has no DOM (spec, Testing Decisions).
// This file keeps vite-plugin-solid out of the test run, because that plugin selects jsdom.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
