// STAGE 8 — tests for nesting-depth, redundant-broadcasts, polling-loop

import { checkNestingDepth } from '../../src/analyser/rule-based/checkers/performance/nesting-depth';
import { checkRedundantBroadcasts } from '../../src/analyser/rule-based/checkers/performance/redundant-broadcasts';
import { checkPollingLoop } from '../../src/analyser/rule-based/checkers/performance/polling-loop';
import {
  makeTarget,
  makeStage,
  makeHatBlock,
  makeIfBlock,
  makeRepeatBlock,
  makeBroadcastBlock,
  makeBroadcastReporter,
  makeBroadcastReceiveHat,
  makeBlock,
  resetIds,
  freshId,
} from '../fixtures/builders';

beforeEach(resetIds);

describe('nesting-depth', () => {
  test('no finding for shallow script', () => {
    const hatId = freshId();
    const bodyId = freshId();
    const ifId = freshId();
    const target = makeTarget({
      blocks: {
        [hatId]: makeHatBlock(hatId, bodyId),
        [bodyId]: makeIfBlock(ifId),
        [ifId]: makeBlock({ opcode: 'motion_movesteps' }),
      },
    });
    expect(checkNestingDepth(target)).toHaveLength(0);
  });

  test('warning for depth >= 3', () => {
    const hatId = freshId();
    const if1Id = freshId();
    const if2Id = freshId();
    const if3Id = freshId();
    const target = makeTarget({
      blocks: {
        [hatId]: makeHatBlock(hatId, if1Id),
        [if1Id]: makeIfBlock(if2Id),
        [if2Id]: makeIfBlock(if3Id),
        [if3Id]: makeIfBlock(),
      },
    });
    const findings = checkNestingDepth(target);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].severity).toBe('warning');
  });

  test('detects nested repeat chain and includes product', () => {
    const hatId = freshId();
    const rep1Id = freshId();
    const rep2Id = freshId();
    const rep3Id = freshId();
    const target = makeTarget({
      blocks: {
        [hatId]: makeHatBlock(hatId, rep1Id),
        [rep1Id]: makeRepeatBlock(5, rep2Id),
        [rep2Id]: makeRepeatBlock(10, rep3Id),
        [rep3Id]: makeRepeatBlock(4),
      },
    });
    const findings = checkNestingDepth(target);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].description).toContain('200');
  });
});

describe('redundant-broadcasts', () => {
  test('no finding when send and receive match', () => {
    const reporterId = freshId();
    const sendId = freshId();
    const receiveId = freshId();
    const sprite = makeTarget({
      blocks: {
        [reporterId]: makeBroadcastReporter('go', 'go-id'),
        [sendId]: makeBroadcastBlock('go', 'go-id', reporterId),
        [receiveId]: makeBroadcastReceiveHat('go', 'go-id'),
      },
    });
    expect(checkRedundantBroadcasts([makeStage(), sprite])).toHaveLength(0);
  });

  test('flags broadcast sent but not received', () => {
    const reporterId = freshId();
    const sendId = freshId();
    const sprite = makeTarget({
      blocks: {
        [reporterId]: makeBroadcastReporter('unused', 'u-id'),
        [sendId]: makeBroadcastBlock('unused', 'u-id', reporterId),
      },
    });
    const findings = checkRedundantBroadcasts([makeStage(), sprite]);
    expect(findings).toHaveLength(1);
    expect(findings[0].description).toContain('never received');
  });

  test('flags broadcast received but not sent', () => {
    const receiveId = freshId();
    const sprite = makeTarget({
      blocks: { [receiveId]: makeBroadcastReceiveHat('phantom', 'p-id') },
    });
    const findings = checkRedundantBroadcasts([makeStage(), sprite]);
    expect(findings).toHaveLength(1);
    expect(findings[0].description).toContain('never sent');
  });
});

describe('polling-loop', () => {
  test('flags repeat-until with no body', () => {
    const id = freshId();
    const target = makeTarget({
      blocks: { [id]: makeBlock({ opcode: 'control_repeat_until' }) },
    });
    const findings = checkPollingLoop(target);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
  });

  test('no finding when repeat-until has a body', () => {
    const bodyId = freshId();
    const id = freshId();
    const target = makeTarget({
      blocks: {
        [bodyId]: makeBlock({ opcode: 'motion_movesteps' }),
        [id]: makeBlock({ opcode: 'control_repeat_until', inputs: { SUBSTACK: [2, bodyId] } }),
      },
    });
    expect(checkPollingLoop(target)).toHaveLength(0);
  });
});
