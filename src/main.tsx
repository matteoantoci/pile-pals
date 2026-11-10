import { render } from 'solid-js/web';
import { loadGame } from './shell/save';
import { loadSoundOn } from './shell/settings';
import { watchUpdates } from './shell/update';
import { installSound, setSoundOn } from './sound';
import { App } from './ui/App';

// The save is synchronous, so the level is here before the first frame (research/native-feel/shell.md §3).
// A saved level comes back with no animation and skips the title scene. With no save, the title scene shows,
// and its go button starts a new game.
const saved = loadGame();
if (saved) {
  document.documentElement.dataset['restoring'] = '';
}

const root = document.getElementById('app');
if (!root) {
  throw new Error('index.html has no #app element.');
}
// Before the first touch: the audio session, the sound preload, the unlock on the first touch, and the sound
// switch of the parent area.
installSound();
setSoundOn(loadSoundOn());
render(() => <App restored={saved?.state} />, root);
// The first frame after a restore shows the saved table. From the next frame, motion is allowed again.
if (saved) {
  requestAnimationFrame(() => {
    delete document.documentElement.dataset['restoring'];
  });
}

// The service worker registers and checks for a new version. A new version waits for a safe point:
// the title scene before the first touch, or the start of a level.
watchUpdates();
