# 01: Tracer bullet: one level on the iPhone

Spec: [spec.md](../spec.md)

**What to build:** The Parent installs Pile Pals from Safari on the iPhone and drags a card onto a pile. The app is one fixed level with 2 piles and placeholder pictures. A correct drop snaps the card onto the pile. A wrong drop sends the card back. This ticket sets up the full tool chain, so that every later ticket only adds behaviour.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] The project uses Vite, TypeScript 7 with all strict checks, Solid, vite-plugin-pwa, and Vitest.
- [x] oxlint and oxfmt use `oxc-config-ai-guardrails` with the `base` and `typescript` presets only.
- [x] The pre-commit hook uses git `core.hooksPath` with no hook library. It runs `oxfmt --check`, `oxlint`, `oxlint --type-aware`, `tsc --noEmit`, and `vitest run --passWithNoTests`, in this order.
- [x] The game model is headless: `start`, `apply`, and the `dropCard` action, with the `snapped` and `rejected` events. The UI contains no game rule.
- [x] A Vitest test proves that a wrong drop returns `rejected` and the same state, and that a correct drop returns `snapped`.
- [x] The drag writes `transform` in `pointermove`, with `touch-action: none` and `setPointerCapture`.
- [ ] The repo is public, and a push to `master` deploys the build to GitHub Pages.

## Comments

**Built (branch `ticket/01-tracer-bullet`):**

- Tool chain: Vite 8, TypeScript 7.0.2 (`tsc` is the type checker only), Solid 1.9, vite-plugin-pwa 2.0 (`registerType: 'prompt'`), Vitest 5, oxlint 1.93 with oxlint-tsgolint, oxfmt 0.78, `oxc-config-ai-guardrails` 1.1 (`base` and `typescript` only). pnpm 12.
- Pre-commit hook: `.githooks/pre-commit`. The `prepare` script sets `core.hooksPath` to `.githooks` on `pnpm install`. `pnpm check` runs the same five checks.
- Game model in `src/model/` with the public interface in `src/model/index.ts`: `start`, `apply`, `dropCard`, and the `Action` and `GameEvent` unions. `snapped` also carries `noteIndex` from the spec.
- Tests in `src/model/model.test.ts` use only the public interface.
- Board UI in `src/ui/`: Solid draws the state. `src/ui/drag.ts` writes the card transform in `pointermove`. A wrong drop or a drop on no pile sends the card back with a short WAAPI animation. Ticket 04 adds the lift, the spring, and the shake.
- Placeholder emoji pictures. The level is fixed in `src/model/start.ts` until ticket 03.
- PWA: manifest, icons from `public/icon.svg` (generated at build time by `@vite-pwa/assets-generator`), and a service worker for offline play. Vite `base` is `/pile-pals/`.
- GitHub Actions workflow `.github/workflows/deploy.yml`: on push to `master`, it runs `pnpm check`, then `pnpm build`, then deploys `dist` to GitHub Pages.

**Decisions:**

- `vitest.config.ts` is separate from `vite.config.ts`. vite-plugin-solid selects jsdom for tests, and the model tests need no DOM.
- `oxfmt.config.ts` does not call `defineConfig`. The guardrails type allows `endOfLine: 'auto'`, which oxfmt 0.78 does not accept, so tsc rejects the call. Fix this in `oxc-config-ai-guardrails` later.
- The stylesheet loads from a `<link>` in `index.html`, because `import/no-unassigned-import` rejects a CSS import in TypeScript.
- The drag code writes styles with `style.setProperty`, because `no-param-reassign` rejects `card.style.transform = …`.

**Open:**

- "The repo is public": the orchestrator creates the public GitHub repo and pushes `master`. In the repo settings, set Pages > Source to "GitHub Actions". The workflow then deploys on each push to `master`. The device install check on the iPhone belongs to ticket 16.
