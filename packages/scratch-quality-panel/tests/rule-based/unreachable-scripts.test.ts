// STAGE 5 — tests for unreachable-scripts checker

import { checkUnreachableScripts } from '../../src/analyser/rule-based/checkers/correctness/unreachable-scripts';
import { makeTarget, makeHatBlock, makeFloatingBlock, resetIds, freshId } from '../fixtures/builders';

beforeEach(resetIds);

test('no findings when all top-level blocks are valid hat blocks', () => {
  const id = freshId();
  const target = makeTarget({ blocks: { [id]: makeHatBlock(id) } });
  expect(checkUnreachableScripts(target)).toHaveLength(0);
});

test('flags floating (non-hat topLevel) block', () => {
  const id = freshId();
  const target = makeTarget({ blocks: { [id]: makeFloatingBlock(id) } });
  const findings = checkUnreachableScripts(target);
  expect(findings).toHaveLength(1);
  expect(findings[0].severity).toBe('error');
  expect(findings[0].blockId).toBe(id);
});

test('does not flag shadow blocks', () => {
  const id = freshId();
  const target = makeTarget({
    blocks: {
      [id]: { opcode: 'operator_add', next: null, parent: null, inputs: {}, fields: {}, shadow: true, topLevel: true },
    },
  });
  expect(checkUnreachableScripts(target)).toHaveLength(0);
});

test('empty sprite has no findings', () => {
  expect(checkUnreachableScripts(makeTarget())).toHaveLength(0);
});
