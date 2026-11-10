# 01: Tracer bullet: one level on the iPhone

Spec: [spec.md](../spec.md)

**What to build:** The Parent installs Pile Pals from Safari on the iPhone and drags a card onto a pile. The app is one fixed level with 2 piles and placeholder pictures. A correct drop snaps the card onto the pile. A wrong drop sends the card back. This ticket sets up the full tool chain, so that every later ticket only adds behaviour.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The project uses Vite, TypeScript 7 with all strict checks, Solid, vite-plugin-pwa, and Vitest.
- [ ] oxlint and oxfmt use `oxc-config-ai-guardrails` with the `base` and `typescript` presets only.
- [ ] The pre-commit hook uses git `core.hooksPath` with no hook library. It runs `oxfmt --check`, `oxlint`, `oxlint --type-aware`, `tsc --noEmit`, and `vitest run --passWithNoTests`, in this order.
- [ ] The game model is headless: `start`, `apply`, and the `dropCard` action, with the `snapped` and `rejected` events. The UI contains no game rule.
- [ ] A Vitest test proves that a wrong drop returns `rejected` and the same state, and that a correct drop returns `snapped`.
- [ ] The drag writes `transform` in `pointermove`, with `touch-action: none` and `setPointerCapture`.
- [ ] The repo is public, and a push to `master` deploys the build to GitHub Pages.
