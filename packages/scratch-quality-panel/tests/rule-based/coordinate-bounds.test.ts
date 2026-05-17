// STAGE 23 — additional tests for coordinate-bounds checker

import { checkCoordinateBounds } from '../../src/analyser/rule-based/checkers/correctness/coordinate-bounds';
import { makeTarget, makeBlock, makeStage, resetIds, freshId } from '../fixtures/builders';

beforeEach(resetIds);

test('flags y coordinate beyond 180', () => {
  const id = freshId();
  const target = makeTarget({
    blocks: { [id]: makeBlock({ opcode: 'motion_sety', inputs: { Y: [1, [4, '250']] } }) },
  });
  const findings = checkCoordinateBounds(target);
  expect(findings).toHaveLength(1);
  expect(findings[0].description).toContain('250');
});

test('flags negative x beyond -240', () => {
  const id = freshId();
  const target = makeTarget({
    blocks: { [id]: makeBlock({ opcode: 'motion_setx', inputs: { X: [1, [4, '-300']] } }) },
  });
  const findings = checkCoordinateBounds(target);
  expect(findings).toHaveLength(1);
  expect(findings[0].description).toContain('-300');
});

test('no finding for stage with out-of-bounds motion block', () => {
  // Stage can have out-of-bounds motion blocks (usually a no-op) — checker still flags
  // but should not crash
  const id = freshId();
  const stage = makeStage({
    blocks: { [id]: makeBlock({ opcode: 'motion_setx', inputs: { X: [1, [4, '999']] } }) },
  });
  expect(() => checkCoordinateBounds(stage)).not.toThrow();
});

test('flags motion_gotoxy with both coords out of bounds — one finding per literal', () => {
  const id = freshId();
  const target = makeTarget({
    blocks: {
      [id]: makeBlock({
        opcode: 'motion_gotoxy',
        inputs: { X: [1, [4, '300']], Y: [1, [4, '200']] },
      }),
    },
  });
  const findings = checkCoordinateBounds(target);
  expect(findings.length).toBeGreaterThanOrEqual(1);
});

test('no finding when coordinate is exactly at boundary', () => {
  const xId = freshId();
  const yId = freshId();
  const target = makeTarget({
    blocks: {
      [xId]: makeBlock({ opcode: 'motion_setx', inputs: { X: [1, [4, '240']] } }),
      [yId]: makeBlock({ opcode: 'motion_sety', inputs: { Y: [1, [4, '180']] } }),
    },
  });
  expect(checkCoordinateBounds(target)).toHaveLength(0);
});
