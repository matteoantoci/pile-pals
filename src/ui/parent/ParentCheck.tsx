import { createSignal, For } from 'solid-js';
import { isParentAnswer, parentProblem } from '../../model';
import { newSeed } from '../../shell/seed';
import type { ParentProblem } from '../../model';
import type { JSX } from 'solid-js';

// The parent check (spec Module 11): a multiplication problem and a digit pad over the title scene.
// The right answer opens the parent area. A wrong answer closes the check. Each check shows a new problem.

/** The problem of the last check. The next check never shows it again. */
let last: ParentProblem | undefined;

/** The longest answer is 81. */
const MAX_DIGITS = 2;
const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

export type ParentCheckProps = {
  /** The right answer. */
  readonly onPass: () => void;
  /** A wrong answer or the cancel button. */
  readonly onClose: () => void;
};

export const ParentCheck = (props: ParentCheckProps): JSX.Element => {
  const problem = parentProblem(newSeed(), last);
  last = problem;
  const [answer, setAnswer] = createSignal('');
  const type = (digit: string): void => {
    setAnswer((typed) => (typed.length < MAX_DIGITS ? typed + digit : typed));
  };
  const submit = (): void => {
    if (isParentAnswer(problem, Number(answer()))) {
      props.onPass();
      return;
    }
    props.onClose();
  };
  return (
    <div class="parent-check" role="dialog" aria-modal="true" aria-labelledby="parent-check-title">
      <div class="parent-check-box">
        <h2 id="parent-check-title">For grown-ups</h2>
        <p>Give the answer to open the parent area.</p>
        <p class="parent-problem">
          {problem.left} × {problem.right} = <output>{answer() === '' ? '?' : answer()}</output>
        </p>
        <div class="parent-pad">
          <For each={DIGITS}>
            {(digit) => (
              <button type="button" onClick={() => type(digit)}>
                {digit}
              </button>
            )}
          </For>
          <button type="button" aria-label="Delete" onClick={() => setAnswer((typed) => typed.slice(0, -1))}>
            ⌫
          </button>
          <button type="button" onClick={() => type('0')}>
            0
          </button>
          <button type="button" class="parent-ok" disabled={answer() === ''} onClick={submit}>
            OK
          </button>
        </div>
        <button type="button" class="parent-link" onClick={() => props.onClose()}>
          Cancel
        </button>
      </div>
    </div>
  );
};
