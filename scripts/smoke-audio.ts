// The audio recorder of the smoke run (scripts/smoke.ts). It reads the CDP WebAudio domain, which sees each
// AudioContext of the page. An init script that patches AudioContext runs in an isolated world and sees nothing.

import type { CDPSession } from 'puppeteer-core';

/** The realtime contexts (created, changed, closed) and the started buffer sources since the last reset. */
export type AudioRecord = {
  /** The context states in order, for example "new suspended > running". */
  readonly contexts: () => string;
  readonly sources: () => number;
  readonly reset: () => void;
};

export const recordAudio = async (cdp: CDPSession): Promise<AudioRecord> => {
  const contexts: string[] = [];
  let sources = 0;
  cdp.on('WebAudio.contextCreated', (event) => {
    if (event.context.contextType === 'realtime') {
      contexts.push(`new ${event.context.contextState}`);
    }
  });
  cdp.on('WebAudio.contextChanged', (event) => {
    if (event.context.contextType === 'realtime') {
      contexts.push(event.context.contextState);
    }
  });
  cdp.on('WebAudio.audioNodeCreated', (event) => {
    if (event.node.nodeType.startsWith('AudioBufferSource')) {
      sources += 1;
    }
  });
  await cdp.send('WebAudio.enable');
  return {
    contexts: () => contexts.join(' > '),
    sources: () => sources,
    reset: () => {
      contexts.length = 0;
      sources = 0;
    },
  };
};
