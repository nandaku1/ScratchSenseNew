// STAGE 5 — tests for infinite-loops checker

import { checkInfiniteLoops } from '../../src/analyser/rule-based/checkers/correctness/infinite-loops';
import {
  makeTarget,
  makeForeverBlock,
  makeStopBlock,
  makeWaitBlock,
  resetIds,
  freshId,
} from '../fixtures/builders';

beforeEach(resetIds);

test('forever with no substack is error', () => {
  const id = freshId();
  const target = makeTarget({ blocks: { [id]: makeForeverBlock() } });
  const findings = checkInfiniteLoops(target);
  expect(findings).toHaveLength(1);
  expect(findings[0].severity).toBe('error');
});

test('forever with stop block has no finding', () => {
  const stopId = freshId();
  const foreverId = freshId();
  const target = makeTarget({
    blocks: {
      [stopId]: makeStopBlock('all'),
      [foreverId]: makeForeverBlock(stopId),
    },
  });
  expect(checkInfiniteLoops(target)).toHaveLength(0);
});

test('forever with wait but no stop is warning', () => {
  const waitId = freshId();
  const foreverId = freshId();
  const target = makeTarget({
    blocks: {
      [waitId]: makeWaitBlock(),
      [foreverId]: makeForeverBlock(waitId),
    },
  });
  const findings = checkInfiniteLoops(target);
  expect(findings).toHaveLength(1);
  expect(findings[0].severity).toBe('warning');
});

test('forever with body but no stop/wait is error', () => {
  const bodyId = freshId();
  const foreverId = freshId();
  const target = makeTarget({
    blocks: {
      [bodyId]: { opcode: 'motion_movesteps', next: null, parent: null, inputs: {}, fields: {}, shadow: false, topLevel: false },
      [foreverId]: makeForeverBlock(bodyId),
    },
  });
  const findings = checkInfiniteLoops(target);
  expect(findings).toHaveLength(1);
  expect(findings[0].severity).toBe('error');
});
