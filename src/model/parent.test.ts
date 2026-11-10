import { describe, expect, it } from 'vitest';
import { isParentAnswer, parentProblem } from './index';
import type { ParentProblem } from './index';

const SEEDS = Array.from({ length: 500 }, (_, index) => index * 7919);

describe('parentProblem', () => {
  it('gives two factors from 3 to 9', () => {
    const factors = SEEDS.flatMap((seed) => {
      const problem = parentProblem(seed);
      return [problem.left, problem.right];
    });

    expect(new Set(factors)).toEqual(new Set([3, 4, 5, 6, 7, 8, 9]));
  });

  it('can give each of the 49 problems', () => {
    const problems = new Set(
      SEEDS.map((seed) => `${String(parentProblem(seed).left)}x${String(parentProblem(seed).right)}`)
    );

    expect(problems.size).toBe(49);
  });

  it('never gives the last problem again', () => {
    const last: ParentProblem = { left: 7, right: 8 };

    const repeats = SEEDS.map((seed) => parentProblem(seed, last)).filter(
      (problem) => problem.left === last.left && problem.right === last.right
    );

    expect(repeats).toEqual([]);
  });
});

describe('isParentAnswer', () => {
  const problem: ParentProblem = { left: 7, right: 8 };

  it('accepts the product', () => {
    expect(isParentAnswer(problem, 56)).toBe(true);
  });

  it('refuses a wrong answer', () => {
    expect(isParentAnswer(problem, 54)).toBe(false);
    expect(isParentAnswer(problem, 15)).toBe(false);
    expect(isParentAnswer(problem, 0)).toBe(false);
  });
});
