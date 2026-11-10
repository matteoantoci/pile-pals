// The save code of the parent area (spec, "Save data shape"): the save data, compressed and encoded as text.
// The Parent keeps the code to get the progress back when iOS deletes the app data, or to move it to a new device.
// The code is the JSON of `SaveData`, compressed with raw DEFLATE, in base64url (RFC 4648 §5) with no padding.

import { restore } from './save';
import type { RestoreResult, SaveData } from './save';

const FORMAT = 'deflate-raw';

/** Sends the bytes through a compression or decompression stream. A damaged input makes the promise fail. */
const pipe = async (
  bytes: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream
): Promise<Uint8Array<ArrayBuffer>> =>
  new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

/** The text of a save code. A code from the parent area of this app is always text of this alphabet. */
const CODE = /^[\w-]+$/u;

/** The save code of one save. */
export const saveCode = async (save: SaveData): Promise<string> => {
  const packed = await pipe(new TextEncoder().encode(JSON.stringify(save)), new CompressionStream(FORMAT));
  const base64 = btoa(Array.from(packed, (byte) => String.fromCodePoint(byte)).join(''));
  return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

/**
 * Reads a save code that the Parent pasted. Spaces and line breaks in the code are ignored. It never throws:
 * text that is not a save code gives `reason: 'shape'`, and a code of an unknown schema version gives `'version'`.
 */
export const readSaveCode = async (code: string): Promise<RestoreResult> => {
  const text = code.replaceAll(/\s/gu, '');
  if (!CODE.test(text)) {
    return { ok: false, reason: 'shape' };
  }
  try {
    const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
    const packed = Uint8Array.from(binary, (char) => char.codePointAt(0) ?? 0);
    const json = new TextDecoder().decode(await pipe(packed, new DecompressionStream(FORMAT)));
    return restore(JSON.parse(json));
  } catch {
    // atob, the decompression, and JSON.parse throw on damaged text.
    return { ok: false, reason: 'shape' };
  }
};
