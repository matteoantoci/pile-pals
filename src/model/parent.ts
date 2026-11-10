// The parent check (spec Module 11): a multiplication problem that an adult can answer and the Child cannot.
// The UI gives a new seed each time the check opens, so the Child cannot learn the answer.

import { randomFrom } from './random';

/** The problem "left × right". */
export type ParentProblem = {
  readonly left: number;
  readonly right: number;
};

const FACTORS = [3, 4, 5, 6, 7, 8, 9] as const;

/** All 49 problems. */
const PROBLEMS: readonly ParentProblem[] = FACTORS.flatMap((left) => FACTORS.map((right) => ({ left, right })));

/** A problem with two factors from 3 to 9. It is never the same as `last`, the problem that showed before. */
export const parentProblem = (seed: number, last?: ParentProblem): ParentProblem => {
  const choices = PROBLEMS.filter((problem) => problem.left !== last?.left || problem.right !== last.right);
  return randomFrom(seed).pick(choices) ?? { left: 3, right: 3 };
};

/** True when `answer` is the product of the problem. */
export const isParentAnswer = (problem: ParentProblem, answer: number): boolean =>
  answer === problem.left * problem.right;
