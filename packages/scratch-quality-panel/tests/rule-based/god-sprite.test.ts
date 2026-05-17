// STAGE 23 — additional tests for god-sprite checker

import { checkGodSprite } from '../../src/analyser/rule-based/checkers/maintainability/god-sprite';
import { makeTarget, makeHatBlock, makeBlock, makeStage, resetIds, freshId } from '../fixtures/builders';

beforeEach(resetIds);

test('exactly 14 scripts produces no finding (below warning threshold)', () => {
  const blocks: Record<string, ReturnType<typeof makeBlock>> = {};
  for (let i = 0; i < 14; i++) {
    const id = freshId();
    blocks[id] = makeHatBlock(id);
  }
  expect(checkGodSprite(makeTarget({ blocks }))).toHaveLength(0);
});

test('exactly 15 scripts produces warning (at threshold)', () => {
  const blocks: Record<string, ReturnType<typeof makeBlock>> = {};
  for (let i = 0; i < 15; i++) {
    const id = freshId();
    blocks[id] = makeHatBlock(id);
  }
  const findings = checkGodSprite(makeTarget({ blocks }));
  expect(findings).toHaveLength(1);
  expect(findings[0].severity).toBe('warning');
});

test('25 or more scripts produces error severity', () => {
  const blocks: Record<string, ReturnType<typeof makeBlock>> = {};
  for (let i = 0; i < 25; i++) {
    const id = freshId();
    blocks[id] = makeHatBlock(id);
  }
  const findings = checkGodSprite(makeTarget({ blocks }));
  expect(findings).toHaveLength(1);
  expect(findings[0].severity).toBe('error');
});

test('non-hat top-level blocks are not counted as scripts', () => {
  const blocks: Record<string, ReturnType<typeof makeBlock>> = {};
  for (let i = 0; i < 14; i++) {
    const id = freshId();
    blocks[id] = makeHatBlock(id);
  }
  const floatId = freshId();
  blocks[floatId] = makeBlock({ opcode: 'operator_add', topLevel: true });
  expect(checkGodSprite(makeTarget({ blocks }))).toHaveLength(0);
});
