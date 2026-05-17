// STAGE 23 — additional tests for magic-numbers checker

import { checkMagicNumbers } from '../../src/analyser/rule-based/checkers/maintainability/magic-numbers';
import { makeTarget, makeBlock, resetIds, freshId } from '../fixtures/builders';

beforeEach(resetIds);

test('number appearing exactly twice is not flagged (below threshold)', () => {
  const id1 = freshId();
  const id2 = freshId();
  const target = makeTarget({
    blocks: {
      [id1]: makeBlock({ opcode: 'motion_movesteps', inputs: { STEPS: [1, [4, '99']] } }),
      [id2]: makeBlock({ opcode: 'motion_movesteps', inputs: { STEPS: [1, [4, '99']] } }),
    },
  });
  expect(checkMagicNumbers(target)).toHaveLength(0);
});

test('negative number appearing 3 times is flagged', () => {
  const blocks: Record<string, ReturnType<typeof makeBlock>> = {};
  for (let i = 0; i < 3; i++) {
    const id = freshId();
    blocks[id] = makeBlock({ opcode: 'motion_movesteps', inputs: { STEPS: [1, [4, '-42']] } });
  }
  const target = makeTarget({ blocks });
  const findings = checkMagicNumbers(target);
  expect(findings).toHaveLength(1);
  expect(findings[0].description).toContain('-42');
});

test('zero appearing 3 times is not flagged (exempt)', () => {
  const blocks: Record<string, ReturnType<typeof makeBlock>> = {};
  for (let i = 0; i < 3; i++) {
    const id = freshId();
    blocks[id] = makeBlock({ opcode: 'motion_movesteps', inputs: { STEPS: [1, [4, '0']] } });
  }
  expect(checkMagicNumbers(makeTarget({ blocks }))).toHaveLength(0);
});

test('counts accumulate across different blocks for same value', () => {
  const id1 = freshId();
  const id2 = freshId();
  const id3 = freshId();
  const target = makeTarget({
    blocks: {
      [id1]: makeBlock({ opcode: 'motion_movesteps', inputs: { STEPS: [1, [4, '77']] } }),
      [id2]: makeBlock({ opcode: 'motion_turnright', inputs: { DEGREES: [1, [4, '77']] } }),
      [id3]: makeBlock({ opcode: 'motion_movesteps', inputs: { STEPS: [1, [4, '77']] } }),
    },
  });
  const findings = checkMagicNumbers(target);
  expect(findings).toHaveLength(1);
  expect(findings[0].description).toContain('77');
  expect(findings[0].description).toContain('3');
});
