// A check of the shipped data, as the asset test of labrynth2: each picture, animation, and sound file
// that the app ships must have an entry in the credits list. The test reads files only. It runs no app code.
import { describe, expect, it } from 'vitest';
import credits from './credits.json';

const FOLDERS = ['pictures', 'animations', 'sounds'] as const;

// The keys are the paths below the project root, for example "/public/sounds/boing-2.wav".
// Without `eager`, Vite only lists the files and does not load them.
const shipped: readonly string[] = Object.keys(
  import.meta.glob(['/public/pictures/*', '/public/animations/*', '/public/sounds/*'])
).map((path) => path.replace(/^\/public\//u, ''));

/** A credits path is a file below public/ ("sounds/boing-2.wav") or all files of one folder ("pictures/*"). */
const matches = (pattern: string, file: string): boolean => {
  if (!pattern.endsWith('/*')) {
    return pattern === file;
  }
  const folder = pattern.slice(0, -1);
  return file.startsWith(folder) && !file.slice(folder.length).includes('/');
};

const licence = (key: string): { readonly creditRequired: boolean } | undefined =>
  Object.entries(credits.licences).find(([name]) => name === key)?.[1];

describe('the credits list (src/credits.json)', () => {
  it('finds the shipped files in each folder', () => {
    const empty = FOLDERS.filter((folder) => !shipped.some((file) => file.startsWith(`${folder}/`)));

    expect(empty).toEqual([]);
  });

  it('has an entry for each shipped picture, animation, and sound file', () => {
    const missing = shipped.filter(
      (file) => !credits.entries.some((entry) => entry.files.some((pattern) => matches(pattern, file)))
    );

    expect(missing).toEqual([]);
  });

  it('names only files that the app ships', () => {
    const patterns = credits.entries.flatMap((entry) => entry.files);

    expect(patterns.filter((pattern) => !shipped.some((file) => matches(pattern, file)))).toEqual([]);
  });

  it('gives each entry a licence of the list', () => {
    expect(credits.entries.filter((entry) => !licence(entry.licence)).map((entry) => entry.title)).toEqual([]);
  });

  it('gives each work that needs a credit its title, author, page, and change', () => {
    const needCredit = credits.entries.filter((entry) => licence(entry.licence)?.creditRequired);
    const incomplete = needCredit.filter((entry) => [entry.title, entry.author, entry.url, entry.change].includes(''));

    expect(needCredit.map((entry) => entry.title)).toContain('Otters Squeaking.wav');
    expect(incomplete.map((entry) => entry.title)).toEqual([]);
  });
});
