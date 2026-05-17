// STAGE 7 — tests for no-entry-point, coordinate-bounds, zero-duration-say, unanswered-ask

import { checkNoEntryPoint } from '../../src/analyser/rule-based/checkers/correctness/no-entry-point';
import { checkCoordinateBounds } from '../../src/analyser/rule-based/checkers/correctness/coordinate-bounds';
import { checkZeroDurationSay } from '../../src/analyser/rule-based/checkers/correctness/zero-duration-say';
import { checkUnansweredAsk } from '../../src/analyser/rule-based/checkers/correctness/unanswered-ask';
import { makeTarget, makeHatBlock, makeBlock, makeStage, resetIds, freshId } from '../fixtures/builders';

beforeEach(resetIds);

describe('no-entry-point', () => {
  test('no finding when a sprite has green flag hat', () => {
    const id = freshId();
    const sprite = makeTarget({ blocks: { [id]: makeHatBlock(id) } });
    expect(checkNoEntryPoint([makeStage(), sprite])).toHaveLength(0);
  });

  test('warning when no green flag hat exists in project', () => {
    const findings = checkNoEntryPoint([makeStage()]);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
  });
});

describe('coordinate-bounds', () => {
  test('flags x coordinate beyond 240', () => {
    const id = freshId();
    const target = makeTarget({
      blocks: {
        [id]: makeBlock({
          opcode: 'motion_setx',
          inputs: { X: [1, [4, '300']] },
        }),
      },
    });
    const findings = checkCoordinateBounds(target);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
    expect(findings[0].description).toContain('300');
  });

  test('no finding for in-bounds coordinate', () => {
    const id = freshId();
    const target = makeTarget({
      blocks: {
        [id]: makeBlock({
          opcode: 'motion_setx',
          inputs: { X: [1, [4, '100']] },
        }),
      },
    });
    expect(checkCoordinateBounds(target)).toHaveLength(0);
  });
});

describe('zero-duration-say', () => {
  test('flags say-for-secs with 0 duration', () => {
    const id = freshId();
    const target = makeTarget({
      blocks: {
        [id]: makeBlock({
          opcode: 'looks_sayforsecs',
          inputs: { MESSAGE: [1, [10, 'Hi']], SECS: [1, [4, '0']] },
        }),
      },
    });
    const findings = checkZeroDurationSay(target);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
  });

  test('no finding for non-zero duration', () => {
    const id = freshId();
    const target = makeTarget({
      blocks: {
        [id]: makeBlock({
          opcode: 'looks_sayforsecs',
          inputs: { MESSAGE: [1, [10, 'Hi']], SECS: [1, [4, '2']] },
        }),
      },
    });
    expect(checkZeroDurationSay(target)).toHaveLength(0);
  });
});

describe('unanswered-ask', () => {
  test('no finding when answer is read', () => {
    const askId = freshId();
    const answerId = freshId();
    const sprite = makeTarget({
      blocks: {
        [askId]: makeBlock({ opcode: 'sensing_askandwait' }),
        [answerId]: makeBlock({ opcode: 'sensing_answer' }),
      },
    });
    expect(checkUnansweredAsk([makeStage(), sprite])).toHaveLength(0);
  });

  test('warning when ask exists but answer is never read', () => {
    const askId = freshId();
    const sprite = makeTarget({
      blocks: { [askId]: makeBlock({ opcode: 'sensing_askandwait' }) },
    });
    const findings = checkUnansweredAsk([makeStage(), sprite]);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
  });

  test('no finding when neither ask nor answer exist', () => {
    expect(checkUnansweredAsk([makeStage()])).toHaveLength(0);
  });
});
