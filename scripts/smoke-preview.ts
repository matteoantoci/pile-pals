// The preview server of the smoke run (scripts/smoke.ts). It serves dist/ with `vite preview` through portless,
// under a name unique to the run, so 2 checkouts can run the smoke at the same time.

import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createInterface } from 'node:readline';
import type { ChildProcess } from 'node:child_process';

const NAME = `pp-smoke-${String(process.pid)}`;
const READY_MS = 30_000;

export type Server = { readonly url: string; readonly child: ChildProcess };

/**
 * Starts `vite preview` through portless. portless gives the port in $PORT. The shell prints it before vite starts,
 * and the script waits until vite prints its URL.
 */
export const startPreview = async (): Promise<Server> => {
  const child = spawn(
    'portless',
    [
      NAME,
      'sh',
      '-c',
      'echo "smoke-port=$PORT"; exec node_modules/.bin/vite preview --host 127.0.0.1 --port "$PORT" --strictPort',
    ],
    { stdio: ['ignore', 'pipe', 'inherit'], detached: true }
  );
  const lines = createInterface({ input: child.stdout });
  const ready = Promise.withResolvers<string>();
  let port = '';
  lines.on('line', (line) => {
    port = /smoke-port=(\d+)/u.exec(line)?.[1] ?? port;
    if (port && line.includes('Local:')) {
      ready.resolve(port);
    }
  });
  child.on('exit', () => ready.reject(new Error('portless did not start vite preview.')));
  const timer = setTimeout(() => child.kill(), READY_MS);
  await ready.promise.finally(() => clearTimeout(timer));
  return { url: `http://127.0.0.1:${port}/pile-pals/`, child };
};

/** Stops portless and vite: the whole process group. A second call does nothing. */
export const stopPreview = async ({ child }: Server): Promise<void> => {
  if (child.pid === undefined || child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  process.kill(-child.pid, 'SIGTERM');
  await once(child, 'exit');
};
