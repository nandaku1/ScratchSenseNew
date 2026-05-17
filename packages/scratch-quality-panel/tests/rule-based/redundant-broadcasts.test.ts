// STAGE 23 — additional tests for redundant-broadcasts checker

import { checkRedundantBroadcasts } from '../../src/analyser/rule-based/checkers/performance/redundant-broadcasts';
import {
  makeTarget,
  makeStage,
  makeBroadcastBlock,
  makeBroadcastReporter,
  makeBroadcastReceiveHat,
  resetIds,
  freshId,
} from '../fixtures/builders';

beforeEach(resetIds);

test('empty project produces no findings', () => {
  expect(checkRedundantBroadcasts([makeStage()])).toHaveLength(0);
});

test('two mismatches produce two findings', () => {
  const r1 = freshId();
  const s1 = freshId();
  const r2 = freshId();
  const sprite = makeTarget({
    blocks: {
      [r1]: makeBroadcastReporter('alpha', 'a-id'),
      [s1]: makeBroadcastBlock('alpha', 'a-id', r1),
      [r2]: makeBroadcastReceiveHat('beta', 'b-id'),
    },
  });
  const findings = checkRedundantBroadcasts([makeStage(), sprite]);
  expect(findings).toHaveLength(2);
});

test('broadcast matched across two sprites produces no findings', () => {
  const reporterId = freshId();
  const sendId = freshId();
  const receiveId = freshId();
  const sender = makeTarget({
    name: 'Sender',
    blocks: {
      [reporterId]: makeBroadcastReporter('ping', 'p-id'),
      [sendId]: makeBroadcastBlock('ping', 'p-id', reporterId),
    },
  });
  const receiver = makeTarget({
    name: 'Receiver',
    blocks: { [receiveId]: makeBroadcastReceiveHat('ping', 'p-id') },
  });
  expect(checkRedundantBroadcasts([makeStage(), sender, receiver])).toHaveLength(0);
});

test('event_broadcastandwait also counts as a sender', () => {
  const reporterId = freshId();
  const sendId = freshId();
  const sprite = makeTarget({
    blocks: {
      [reporterId]: makeBroadcastReporter('go', 'g-id'),
      [sendId]: {
        opcode: 'event_broadcastandwait',
        next: null,
        parent: null,
        inputs: { BROADCAST_INPUT: [1, reporterId] },
        fields: {},
        shadow: false,
        topLevel: false,
      },
    },
  });
  const findings = checkRedundantBroadcasts([makeStage(), sprite]);
  expect(findings).toHaveLength(1);
  expect(findings[0].description).toContain('never received');
});

test('same broadcast sent multiple times only produces one finding', () => {
  const r1 = freshId();
  const s1 = freshId();
  const r2 = freshId();
  const s2 = freshId();
  const sprite = makeTarget({
    blocks: {
      [r1]: makeBroadcastReporter('dup', 'd-id'),
      [s1]: makeBroadcastBlock('dup', 'd-id', r1),
      [r2]: makeBroadcastReporter('dup', 'd-id'),
      [s2]: makeBroadcastBlock('dup', 'd-id', r2),
    },
  });
  const findings = checkRedundantBroadcasts([makeStage(), sprite]);
  expect(findings).toHaveLength(1);
});
