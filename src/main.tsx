import { render } from 'solid-js/web';
import { start } from './model';
import { loadGame } from './shell/save';
import { newSeed } from './shell/seed';
import { watchUpdates } from './shell/update';
import { installSound } from './sound';
import { Board } from './ui/Board';

// The save is synchronous, so the level is here before the first frame (research/native-feel/shell.md §3).
// A saved level comes back with no animation; a new game takes a new seed, because the model has no random source.
const saved = loadGame();
const first = saved?.state ?? start({ level: 1 }, newSeed());
if (saved) {
  document.documentElement.dataset['restoring'] = '';
}

const root = document.getElementById('app');
if (!root) {
  throw new Error('index.html has no #app element.');
}
// Before the first touch: the audio session, the sound preload, and the unlock on the first touch.
installSound();
render(() => <Board initial={first} />, root);
// The first frame after a restore shows the saved table. From the next frame, motion is allowed again.
if (saved) {
  requestAnimationFrame(() => {
    delete document.documentElement.dataset['restoring'];
  });
}

// The service worker registers and checks for a new version. A new version waits for a safe point of a level.
watchUpdates();
