// STAGE 5 — tests for empty-scripts checker

import { checkEmptyScripts } from '../../src/analyser/rule-based/checkers/correctness/empty-scripts';
import { makeTarget, makeHatBlock, makeBlock, resetIds, freshId } from '../fixtures/builders';

beforeEach(resetIds);

test('flags hat block with null next', () => {
  const id = freshId();
  const target = makeTarget({ blocks: { [id]: makeHatBlock(id) } });
  const findings = checkEmptyScripts(target);
  expect(findings).toHaveLength(1);
  expect(findings[0].severity).toBe('warning');
  expect(findings[0].description).toContain('when green flag clicked');
});

test('no finding when hat has a next block', () => {
  const hatId = freshId();
  const bodyId = freshId();
  const target = makeTarget({
    blocks: {
      [hatId]: makeHatBlock(hatId, bodyId),
      [bodyId]: makeBlock({ opcode: 'motion_movesteps' }),
    },
  });
  expect(checkEmptyScripts(target)).toHaveLength(0);
});

test('empty sprite has no findings', () => {
  expect(checkEmptyScripts(makeTarget())).toHaveLength(0);
});
