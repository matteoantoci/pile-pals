import { render } from 'solid-js/web';
import { registerSW } from 'virtual:pwa-register';
import { Board } from './ui/Board';

const root = document.getElementById('app');
if (!root) {
  throw new Error('index.html has no #app element.');
}
render(() => <Board />, root);

// Registers the service worker for offline play. A new version waits until the next cold start.
// Ticket 09 applies an update at the safe moments of the spec.
registerSW({ immediate: true });
