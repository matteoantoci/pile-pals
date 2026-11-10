import { For, Show } from 'solid-js';
import credits from '../../credits.json';
import type { JSX } from 'solid-js';

// The credits (spec user story 56, "Further Notes"). The list comes from src/credits.json, the file that the
// credits test checks against each shipped picture, animation, and sound. The works with a licence that needs a
// credit show first, with the change that we made (CC BY 4.0 §3(a)(1)(B)). The CC0 works follow, as thanks.

type Entry = (typeof credits.entries)[number];
type Licence = (typeof credits.licences)[keyof typeof credits.licences];

/** One licence and its works. */
type Group = { readonly licence: Licence; readonly entries: readonly Entry[] };

const groups: readonly Group[] = Object.entries(credits.licences)
  .map(([key, licence]) => ({ licence, entries: credits.entries.filter((entry) => entry.licence === key) }))
  .filter((group) => group.entries.length > 0)
  .toSorted((a, b) => Number(b.licence.creditRequired) - Number(a.licence.creditRequired));

/** The licence texts that ship next to the files. */
const LICENCE_FILES = [
  { file: 'pictures/LICENSE.txt', name: 'Pictures: licence text' },
  { file: 'animations/LICENSE.txt', name: 'Animations: licence text' },
] as const;

const Work = (props: { readonly entry: Entry; readonly credit: boolean }): JSX.Element => (
  <li>
    <a href={props.entry.url} target="_blank" rel="noopener noreferrer">
      {props.entry.title}
    </a>{' '}
    by {props.entry.author} ({props.entry.kind})
    <Show when={props.credit}>
      <span class="parent-change">Change: {props.entry.change}</span>
    </Show>
  </li>
);

export const Credits = (): JSX.Element => (
  <section class="parent-section">
    <h2>Credits</h2>
    <p>Pile Pals uses these pictures, animations, and sounds. Thank you to their authors.</p>
    <For each={groups}>
      {(group) => (
        <>
          <h3>
            <a href={group.licence.url} target="_blank" rel="noopener noreferrer">
              {group.licence.name}
            </a>
            {group.licence.creditRequired ? '' : ': no credit is necessary, with thanks'}
          </h3>
          <ul class="parent-credits">
            <For each={group.entries}>{(entry) => <Work entry={entry} credit={group.licence.creditRequired} />}</For>
          </ul>
        </>
      )}
    </For>
    <ul class="parent-credits">
      <For each={LICENCE_FILES}>
        {(text) => (
          <li>
            <a href={`${import.meta.env.BASE_URL}${text.file}`} target="_blank" rel="noopener noreferrer">
              {text.name}
            </a>
          </li>
        )}
      </For>
    </ul>
  </section>
);
