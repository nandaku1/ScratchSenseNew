// STAGE 23 — additional tests for no-entry-point checker

import { checkNoEntryPoint } from '../../src/analyser/rule-based/checkers/correctness/no-entry-point';
import { makeTarget, makeHatBlock, makeBlock, makeStage, resetIds, freshId } from '../fixtures/builders';

beforeEach(resetIds);

test('empty targets array returns no findings', () => {
  expect(checkNoEntryPoint([])).toHaveLength(0);
});

test('sprite with only a "when clicked" hat still triggers warning', () => {
  const id = freshId();
  const sprite = makeTarget({
    blocks: { [id]: makeBlock({ opcode: 'event_whenthisspriteclicked', topLevel: true }) },
  });
  const findings = checkNoEntryPoint([makeStage(), sprite]);
  expect(findings).toHaveLength(1);
  expect(findings[0].description).toContain('green flag');
});

test('multiple sprites none with flag hat produce one finding not many', () => {
  const sprite1 = makeTarget({ name: 'Sprite1' });
  const sprite2 = makeTarget({ name: 'Sprite2' });
  const findings = checkNoEntryPoint([makeStage(), sprite1, sprite2]);
  expect(findings).toHaveLength(1);
});

test('shadowed flag hat block does not count as entry point', () => {
  const id = freshId();
  const sprite = makeTarget({
    blocks: {
      [id]: makeBlock({ opcode: 'event_whenflagclicked', topLevel: true, shadow: true }),
    },
  });
  const findings = checkNoEntryPoint([makeStage(), sprite]);
  expect(findings).toHaveLength(1);
});

test('finding is attributed to the stage sprite', () => {
  const stage = makeStage({ name: 'Stage' });
  const findings = checkNoEntryPoint([stage]);
  expect(findings).toHaveLength(1);
  expect(findings[0].sprite).toBe('Stage');
});
