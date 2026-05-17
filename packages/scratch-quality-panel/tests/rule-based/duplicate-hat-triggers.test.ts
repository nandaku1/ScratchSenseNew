// STAGE 6 — tests for duplicate-hat-triggers checker

import { checkDuplicateHatTriggers } from '../../src/analyser/rule-based/checkers/correctness/duplicate-hat-triggers';
import { makeTarget, makeHatBlock, resetIds, freshId } from '../fixtures/builders';

beforeEach(resetIds);

test('no finding with a single hat block', () => {
  const id = freshId();
  const target = makeTarget({ blocks: { [id]: makeHatBlock(id) } });
  expect(checkDuplicateHatTriggers(target)).toHaveLength(0);
});

test('flags two identical green flag hats', () => {
  const id1 = freshId();
  const id2 = freshId();
  const target = makeTarget({
    blocks: {
      [id1]: makeHatBlock(id1),
      [id2]: makeHatBlock(id2),
    },
  });
  const findings = checkDuplicateHatTriggers(target);
  expect(findings).toHaveLength(1);
  expect(findings[0].description).toContain('when green flag clicked');
});

test('distinct broadcast receivers are not flagged', () => {
  const id1 = freshId();
  const id2 = freshId();
  const target = makeTarget({
    blocks: {
      [id1]: {
        opcode: 'event_whenbroadcastreceived',
        next: null,
        parent: null,
        inputs: {},
        fields: { BROADCAST_OPTION: ['msgA', null] },
        shadow: false,
        topLevel: true,
      },
      [id2]: {
        opcode: 'event_whenbroadcastreceived',
        next: null,
        parent: null,
        inputs: {},
        fields: { BROADCAST_OPTION: ['msgB', null] },
        shadow: false,
        topLevel: true,
      },
    },
  });
  expect(checkDuplicateHatTriggers(target)).toHaveLength(0);
});
