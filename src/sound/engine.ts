// One AudioContext for the whole app (spec Module 8). The unlock and the heal follow
// research/native-feel/shell.md, "Shell code". Files are decoded one time and played at their gain.
import type { Clip } from './levels';

declare global {
  // The Audio Session API of WebKit. lib.dom does not have it yet.
  interface Navigator {
    readonly audioSession?: {
      type: 'auto' | 'playback' | 'transient' | 'transient-solo' | 'ambient' | 'play-and-record';
    };
  }
}

/** A sound that waits longer than this for the context to start is too late. It does not play. */
const LATE_MS = 200;
/** The heal waits this long for the audio clock to move. Design value of shell.md: tune it on the device. */
const CLOCK_WAIT_MS = 150;

let context: AudioContext | undefined;
let decoder: OfflineAudioContext | undefined;
const loading = new Map<string, Promise<AudioBuffer>>();
const ready = new Map<string, AudioBuffer>();

/** The sound switch of the parent area. When it is off, no clip plays. */
let soundOn = true;

/** A resume outside a user gesture can fail. The next gesture tries again, so the failure needs no action. */
const ignore = (): undefined => undefined;

const audio = (): AudioContext => {
  context ??= new AudioContext();
  return context;
};

/** Starts the context, or ends an "interrupted" state. Call it from a user gesture. */
export const unlockAudio = (): void => {
  const ctx = audio();
  if (ctx.state !== 'running') {
    ctx.resume().catch(ignore);
  }
};

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** On return to the foreground: resume. If the clock does not move, suspend and resume.
 * If the clock still does not move, close the context. The next sound makes a new one. */
export const healAudio = async (): Promise<void> => {
  const ctx = context;
  if (!ctx || ctx.state === 'closed') {
    return;
  }
  if (ctx.state !== 'running') {
    ctx.resume().catch(ignore);
    return;
  }
  const before = ctx.currentTime;
  await wait(CLOCK_WAIT_MS);
  if (ctx.currentTime !== before) {
    return;
  }
  await ctx.suspend();
  await ctx.resume();
  await wait(CLOCK_WAIT_MS);
  if (ctx.currentTime === before && context === ctx) {
    context = undefined;
    await ctx.close();
  }
};

/** An AudioBuffer works in each AudioContext. So an offline context decodes before the first touch,
 * and the buffers stay good after the heal makes a new context. */
const decode = (data: ArrayBuffer): Promise<AudioBuffer> => {
  decoder ??= new OfflineAudioContext(1, 1, 44_100);
  return decoder.decodeAudioData(data);
};

const download = async (file: string): Promise<AudioBuffer> => {
  const response = await fetch(`${import.meta.env.BASE_URL}${file}`);
  if (!response.ok) {
    throw new Error(`${file}: HTTP ${String(response.status)}`);
  }
  const buffer = await decode(await response.arrayBuffer());
  ready.set(file, buffer);
  return buffer;
};

/** Loads and decodes a file one time. After a failure, the next call tries again. */
export const loadClip = (file: string): Promise<AudioBuffer> => {
  const known = loading.get(file);
  if (known) {
    return known;
  }
  const next = download(file);
  loading.set(file, next);
  next.catch(() => loading.delete(file));
  return next;
};

type Shot = { readonly buffer: AudioBuffer; readonly gainDb: number; readonly rate: number };

const start = (ctx: AudioContext, shot: Shot): void => {
  const source = new AudioBufferSourceNode(ctx, { buffer: shot.buffer, playbackRate: shot.rate });
  const gain = new GainNode(ctx, { gain: 10 ** (shot.gainDb / 20) });
  source.connect(gain).connect(ctx.destination);
  source.start();
};

/** Turns all sound effects on or off (the sound switch of the parent area, spec Module 11). */
export const setSoundOn = (on: boolean): void => {
  soundOn = on;
};

/** True when the sound effects play. */
export const isSoundOn = (): boolean => soundOn;

/** Plays a clip at its gain. A rate above 1 plays it higher and shorter.
 * A clip that is not decoded yet does not play, because a late sound is wrong. No clip plays when the sound is off. */
export const playClip = (clip: Clip, rate = 1): void => {
  if (!soundOn) {
    return;
  }
  const buffer = ready.get(clip.file);
  if (!buffer) {
    loadClip(clip.file).catch(ignore);
    return;
  }
  const ctx = audio();
  const shot = { buffer, gainDb: clip.gainDb, rate };
  if (ctx.state === 'running') {
    start(ctx, shot);
    return;
  }
  const asked = performance.now();
  ctx
    .resume()
    .then(() => {
      if (performance.now() - asked < LATE_MS) {
        start(ctx, shot);
      }
    })
    .catch(ignore);
};

/** Call one time at start. Sets the audio session, preloads the clips, and unlocks and heals the context. */
export const installAudio = (clips: readonly Clip[]): void => {
  // "playback" (spec Module 8), not the "ambient" of shell.md: iOS can then play with the silent switch on.
  if (navigator.audioSession) {
    navigator.audioSession.type = 'playback';
  }
  for (const clip of clips) {
    loadClip(clip.file).catch(ignore);
  }
  // For a mouse, pointerdown is a user gesture. For a touch, only pointerup is (HTML user activation).
  document.addEventListener('pointerdown', unlockAudio, { capture: true, passive: true });
  document.addEventListener('pointerup', unlockAudio, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      healAudio().catch(ignore);
    }
  });
};
