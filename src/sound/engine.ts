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

/**
 * True after a return from the background. iOS can give back a context that stays silent, and a resume
 * outside a tap can fail, so the next tap closes the old context and starts a new one.
 */
let stale = false;

let context: AudioContext | undefined;
let decoder: OfflineAudioContext | undefined;
const loading = new Map<string, Promise<AudioBuffer>>();
const ready = new Map<string, AudioBuffer>();

/** The sound switch of the parent area. When it is off, no clip plays. */
let soundOn = true;

/** A resume outside a user gesture can fail. The next gesture tries again, so the failure needs no action. */
const ignore = (): undefined => undefined;

/** iOS can drop the audio session type in the background, so each new context sets it again. */
const audio = (): AudioContext => {
  if (!context && navigator.audioSession) {
    navigator.audioSession.type = 'playback';
  }
  context ??= new AudioContext();
  return context;
};

/** Starts the context, or ends an "interrupted" state. After a return from the background, it replaces the
 * context first. Call it from a user gesture. */
export const unlockAudio = (): void => {
  if (stale) {
    stale = false;
    context?.close().catch(ignore);
    context = undefined;
  }
  const ctx = audio();
  if (ctx.state !== 'running') {
    ctx.resume().catch(ignore);
  }
};

/** True when the sound can start only in a tap: no context yet, a return from the background, or a stopped
 * context. iOS starts or resumes the context only in a tap, and the end of a drag is not a tap. */
export const audioNeedsTap = (): boolean => !context || stale || context.state !== 'running';

/** An AudioBuffer works in each AudioContext. So an offline context decodes before the first touch,
 * and the buffers stay good after the unlock makes a new context. */
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

const markStale = (): void => {
  if (context) {
    stale = true;
  }
};

/** Call one time at start. Sets the audio session, preloads the clips, and unlocks the context on each gesture. */
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
  // This listener comes before the listener of the board, so the board sees the stale context.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      markStale();
    }
  });
  // A page that comes back from the back-forward cache keeps its old context too.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      markStale();
    }
  });
};
