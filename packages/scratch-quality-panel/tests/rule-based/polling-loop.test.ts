// STAGE 23 — additional tests for polling-loop checker

import { checkPollingLoop } from '../../src/analyser/rule-based/checkers/performance/polling-loop';
import { makeTarget, makeBlock, resetIds, freshId } from '../fixtures/builders';

beforeEach(resetIds);

test('target with no blocks returns no findings', () => {
  expect(checkPollingLoop(makeTarget())).toHaveLength(0);
});

test('multiple empty repeat-until loops produce multiple findings', () => {
  const id1 = freshId();
  const id2 = freshId();
  const target = makeTarget({
    blocks: {
      [id1]: makeBlock({ opcode: 'control_repeat_until' }),
      [id2]: makeBlock({ opcode: 'control_repeat_until' }),
    },
  });
  expect(checkPollingLoop(target)).toHaveLength(2);
});

test('control_forever loop without body is not flagged', () => {
  const id = freshId();
  const target = makeTarget({
    blocks: { [id]: makeBlock({ opcode: 'control_forever' }) },
  });
  expect(checkPollingLoop(target)).toHaveLength(0);
});

test('control_wait_until is not flagged', () => {
  const id = freshId();
  const target = makeTarget({
    blocks: { [id]: makeBlock({ opcode: 'control_wait_until' }) },
  });
  expect(checkPollingLoop(target)).toHaveLength(0);
});

test('mix of empty and non-empty repeat-until produces correct count', () => {
  const emptyId = freshId();
  const bodyId = freshId();
  const filledId = freshId();
  const target = makeTarget({
    blocks: {
      [emptyId]: makeBlock({ opcode: 'control_repeat_until' }),
      [bodyId]: makeBlock({ opcode: 'motion_movesteps' }),
      [filledId]: makeBlock({ opcode: 'control_repeat_until', inputs: { SUBSTACK: [2, bodyId] } }),
    },
  });
  expect(checkPollingLoop(target)).toHaveLength(1);
});
