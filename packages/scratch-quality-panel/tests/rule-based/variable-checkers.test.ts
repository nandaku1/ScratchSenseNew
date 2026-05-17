// STAGE 6 — tests for uninitialised and write-only variable checkers

import { checkUninitialisedVariables } from '../../src/analyser/rule-based/checkers/correctness/uninitialised-variables';
import { checkWriteOnlyVariables } from '../../src/analyser/rule-based/checkers/correctness/write-only-variables';
import {
  makeTarget,
  makeSetVariableBlock,
  makeVariableReporter,
  resetIds,
  freshId,
} from '../fixtures/builders';

beforeEach(resetIds);

describe('uninitialised-variables', () => {
  test('no finding when variable is both written and read', () => {
    const varId = 'var1';
    const setId = freshId();
    const readId = freshId();
    const target = makeTarget({
      variables: { [varId]: ['score', 0] },
      blocks: {
        [setId]: makeSetVariableBlock('score', varId),
        [readId]: makeVariableReporter('score', varId),
      },
    });
    expect(checkUninitialisedVariables(target)).toHaveLength(0);
  });

  test('flags variable read but never written', () => {
    const varId = 'var1';
    const readId = freshId();
    const target = makeTarget({
      variables: { [varId]: ['score', 0] },
      blocks: { [readId]: makeVariableReporter('score', varId) },
    });
    const findings = checkUninitialisedVariables(target);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
    expect(findings[0].description).toContain('score');
  });

  test('no finding for variable never appearing in blocks', () => {
    const varId = 'var1';
    const target = makeTarget({ variables: { [varId]: ['score', 0] }, blocks: {} });
    expect(checkUninitialisedVariables(target)).toHaveLength(0);
  });
});

describe('write-only-variables', () => {
  test('no finding when variable is both written and read', () => {
    const varId = 'var1';
    const setId = freshId();
    const readId = freshId();
    const target = makeTarget({
      variables: { [varId]: ['score', 0] },
      blocks: {
        [setId]: makeSetVariableBlock('score', varId),
        [readId]: makeVariableReporter('score', varId),
      },
    });
    expect(checkWriteOnlyVariables(target)).toHaveLength(0);
  });

  test('flags variable written but never read', () => {
    const varId = 'var1';
    const setId = freshId();
    const target = makeTarget({
      variables: { [varId]: ['score', 0] },
      blocks: { [setId]: makeSetVariableBlock('score', varId) },
    });
    const findings = checkWriteOnlyVariables(target);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
  });
});
