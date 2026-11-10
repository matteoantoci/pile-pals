import { oxfmt } from 'oxc-config-ai-guardrails';

// No `defineConfig` from oxfmt here: the guardrails type allows `endOfLine: 'auto'`,
// which oxfmt 0.78 does not accept, so tsc rejects the call. The profile sets 'lf'.
export default {
  ...oxfmt,
  ignorePatterns: ['research/**', '.scratch/**', 'docs/**', 'pnpm-lock.yaml'],
};
