// STAGE 23 — additional tests for nesting-depth checker

import { checkNestingDepth } from '../../src/analyser/rule-based/checkers/performance/nesting-depth';
import { makeTarget, makeHatBlock, makeIfBlock, makeBlock, resetIds, freshId } from '../fixtures/builders';

beforeEach(resetIds);

test('hat with no next block returns no findings', () => {
  const hatId = freshId();
  const target = makeTarget({ blocks: { [hatId]: makeHatBlock(hatId) } });
  expect(checkNestingDepth(target)).toHaveLength(0);
});

test('depth exactly 4 produces warning not error', () => {
  const hatId = freshId();
  const if1 = freshId();
  const if2 = freshId();
  const if3 = freshId();
  const if4 = freshId();
  const target = makeTarget({
    blocks: {
      [hatId]: makeHatBlock(hatId, if1),
      [if1]: makeIfBlock(if2),
      [if2]: makeIfBlock(if3),
      [if3]: makeIfBlock(if4),
      [if4]: makeIfBlock(),
    },
  });
  const findings = checkNestingDepth(target);
  expect(findings).toHaveLength(1);
  expect(findings[0].severity).toBe('warning');
});

test('depth >= 5 produces error severity', () => {
  const hatId = freshId();
  const ids = Array.from({ length: 5 }, () => freshId());
  const blocks: Record<string, ReturnType<typeof makeBlock>> = {
    [hatId]: makeHatBlock(hatId, ids[0]),
  };
  for (let i = 0; i < ids.length; i++) {
    blocks[ids[i]] = makeIfBlock(ids[i + 1]);
  }
  const target = makeTarget({ blocks });
  const findings = checkNestingDepth(target);
  expect(findings).toHaveLength(1);
  expect(findings[0].severity).toBe('error');
});

test('only the deep hat produces a finding when two hats exist', () => {
  const hat1 = freshId();
  const hat2 = freshId();
  const if1 = freshId();
  const if2 = freshId();
  const if3 = freshId();
  const target = makeTarget({
    blocks: {
      [hat1]: makeHatBlock(hat1),
      [hat2]: makeHatBlock(hat2, if1),
      [if1]: makeIfBlock(if2),
      [if2]: makeIfBlock(if3),
      [if3]: makeIfBlock(),
    },
  });
  const findings = checkNestingDepth(target);
  expect(findings).toHaveLength(1);
  expect(findings[0].blockId).toBe(hat2);
});

test('target with no blocks returns no findings', () => {
  expect(checkNestingDepth(makeTarget())).toHaveLength(0);
});
