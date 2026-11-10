// The listening page /listen/ (ticket 05). The Parent listens to each candidate at its game level and picks
// keep or replace. Copy answers gives one line for each slot, as the labrynth2 listening pages.
// The data is src/sound/sounds.json (the slots) and src/sound/levels.ts (the files and gains).
import { CLIPS, installSound, loadClip, noteRate, playClip } from '../sound';
import manifestJson from '../sound/sounds.json';
import type { ClipLevel } from '../sound';

type Source = {
  readonly title: string;
  readonly author: string;
  readonly licence: string;
  readonly page: string;
  readonly note: string;
  readonly cut?: { readonly start: number; readonly duration: number };
};
type Slot = {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly pick: string;
  readonly candidates: readonly string[];
  readonly why: string;
};
type Manifest = {
  readonly sections: readonly { readonly name: string; readonly slots: readonly Slot[] }[];
  readonly clips: Readonly<Record<string, Source>>;
};
type Row = { readonly section: string; readonly slot: Slot };
type Candidate = { readonly id: string; readonly source: Source; readonly level: ClipLevel };

const manifest: Manifest = manifestJson;
const NONE = 'none';
/** The snap plays this many rising notes, as on a pile of cards. */
const NOTES = 5;
const NOTE_MS = 350;

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Readonly<Record<string, string>>,
  ...children: readonly (Node | string)[]
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    node.setAttribute(name, value);
  }
  node.append(...children);
  return node;
};

const candidate = (id: string): Candidate => {
  const source = manifest.clips[id];
  const level = CLIPS[id];
  if (!source || !level) {
    throw new Error(`Clip ${id} is not in sounds.json or levels.ts. Run python3 scripts/audio/prep.py.`);
  }
  return { id, source, level };
};

const button = (label: string, onClick: () => void): HTMLButtonElement => {
  const node = el('button', { type: 'button' }, label);
  node.addEventListener('click', onClick);
  return node;
};

const playButtons = (slot: Slot, level: ClipLevel): HTMLElement[] => {
  const play = button('Play', () => playClip(level));
  if (slot.id !== 'snap') {
    return [play];
  }
  const notes = button(`Play ${String(NOTES)} rising notes`, () => {
    for (const note of Array.from({ length: NOTES }, (_, index) => index)) {
      setTimeout(() => playClip(level, noteRate(note)), note * NOTE_MS);
    }
  });
  return [play, notes];
};

const info = ({ source, level }: Candidate): HTMLElement => {
  const cut = source.cut ? ` | cut at ${String(source.cut.start)} s for ${String(source.cut.duration)} s` : '';
  const facts = ` by ${source.author} | ${source.licence} | ${level.seconds.toFixed(2)} s${cut} | ${source.note} | `;
  const page = el('a', { href: source.page, target: '_blank', rel: 'noopener' }, 'page');
  return el('small', {}, el('b', {}, source.title), facts, page);
};

const choice = (name: string, value: string, label: string): HTMLLabelElement => {
  const radio = el('input', { type: 'radio', name, value });
  return el('label', {}, radio, ` ${label} `);
};

const slotBlock = (row: Row, index: number): HTMLElement => {
  const name = `row-${String(index)}`;
  const block = el('div', { class: 'row' }, el('h3', {}, `${row.section} | ${row.slot.name}`));
  block.append(el('p', {}, row.slot.why));
  for (const [number, id] of row.slot.candidates.entries()) {
    const found = candidate(id);
    const label = id === row.slot.pick ? 'keep' : `replace with candidate ${String(number + 1)}`;
    const line = el('div', { class: 'c' }, choice(name, id, label), ...playButtons(row.slot, found.level));
    line.append(el('br', {}), info(found));
    block.append(line);
  }
  block.append(el('div', { class: 'c' }, choice(name, NONE, 'replace: none of these is good')));
  block.querySelector<HTMLInputElement>(`input[value="${row.slot.pick}"]`)?.setAttribute('checked', '');
  return block;
};

const answer = (row: Row, index: number): string => {
  const value = document.querySelector<HTMLInputElement>(`input[name="row-${String(index)}"]:checked`)?.value;
  const prefix = `${row.section} | ${row.slot.name}: `;
  if (value === undefined) {
    return `${prefix}?`;
  }
  if (value === NONE) {
    return `${prefix}replace, none of these is good`;
  }
  const { source } = candidate(value);
  const verb = value === row.slot.pick ? 'keep' : 'replace with';
  return `${prefix}${verb} ${value} (${source.title} by ${source.author})`;
};

const rows: readonly Row[] = manifest.sections.flatMap((section) =>
  section.slots.map((slot) => ({ section: section.name, slot }))
);
// The doubt slots first, then the sure slots (ticket 05).
const ordered = [
  ...rows.filter((row) => row.slot.status !== 'sure'),
  ...rows.filter((row) => row.slot.status === 'sure'),
];
const doubts = ordered.filter((row) => row.slot.status !== 'sure').length;

const out = el('textarea', { rows: '14', readonly: '' });
out.hidden = true;
const status = el('span', {});

const copyAnswers = (): void => {
  const text = ordered.map(answer).join('\n');
  out.value = text;
  out.hidden = false;
  out.select();
  // navigator.clipboard is missing on a page with no HTTPS. The promise chain then reports the failure.
  Promise.resolve()
    .then(() => navigator.clipboard.writeText(text))
    .then(
      () => status.replaceChildren('Copied.'),
      () => status.replaceChildren('Copy failed. Select the text below and copy it.')
    );
};

const blocks = ordered.map(slotBlock);
document.body.append(
  el('h2', {}, 'Doubt: please listen to these'),
  ...blocks.slice(0, doubts),
  el('h2', {}, 'Sure: listening is optional'),
  ...blocks.slice(doubts),
  el('p', {}, button('Copy answers', copyAnswers), ' ', status),
  out
);

installSound();
for (const level of Object.values(CLIPS)) {
  loadClip(level.file).catch(() => status.replaceChildren(`Could not load ${level.file}.`));
}
