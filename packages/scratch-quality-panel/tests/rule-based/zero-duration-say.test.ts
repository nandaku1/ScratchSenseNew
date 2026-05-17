// STAGE 23 — additional tests for zero-duration-say checker

import { checkZeroDurationSay } from '../../src/analyser/rule-based/checkers/correctness/zero-duration-say';
import { makeTarget, makeBlock, resetIds, freshId } from '../fixtures/builders';

beforeEach(resetIds);

test('flags looks_thinkforsecs with 0 duration', () => {
  const id = freshId();
  const target = makeTarget({
    blocks: {
      [id]: makeBlock({
        opcode: 'looks_thinkforsecs',
        inputs: { MESSAGE: [1, [10, 'Hmm']], SECS: [1, [4, '0']] },
      }),
    },
  });
  const findings = checkZeroDurationSay(target);
  expect(findings).toHaveLength(1);
  expect(findings[0].severity).toBe('warning');
});

test('both say-for-secs and think-for-secs with 0 duration produce two findings', () => {
  const sayId = freshId();
  const thinkId = freshId();
  const target = makeTarget({
    blocks: {
      [sayId]: makeBlock({ opcode: 'looks_sayforsecs', inputs: { MESSAGE: [1, [10, 'Hi']], SECS: [1, [4, '0']] } }),
      [thinkId]: makeBlock({ opcode: 'looks_thinkforsecs', inputs: { MESSAGE: [1, [10, 'Hmm']], SECS: [1, [4, '0']] } }),
    },
  });
  const findings = checkZeroDurationSay(target);
  expect(findings).toHaveLength(2);
});

test('no finding for looks_say (not for-secs variant)', () => {
  const id = freshId();
  const target = makeTarget({
    blocks: {
      [id]: makeBlock({ opcode: 'looks_say', inputs: { MESSAGE: [1, [10, 'Hi']] } }),
    },
  });
  expect(checkZeroDurationSay(target)).toHaveLength(0);
});

test('no finding for non-zero integer duration', () => {
  const id = freshId();
  const target = makeTarget({
    blocks: {
      [id]: makeBlock({ opcode: 'looks_sayforsecs', inputs: { MESSAGE: [1, [10, 'Hi']], SECS: [1, [4, '3']] } }),
    },
  });
  expect(checkZeroDurationSay(target)).toHaveLength(0);
});
