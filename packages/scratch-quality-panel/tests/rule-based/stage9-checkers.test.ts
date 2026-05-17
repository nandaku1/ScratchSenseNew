// STAGE 9 — tests for script-length, naming-conventions, dead-custom-blocks, god-sprite, magic-numbers

import { checkScriptLength } from '../../src/analyser/rule-based/checkers/maintainability/script-length';
import { checkNamingConventions } from '../../src/analyser/rule-based/checkers/maintainability/naming-conventions';
import { checkDeadCustomBlocks } from '../../src/analyser/rule-based/checkers/maintainability/dead-custom-blocks';
import { checkGodSprite } from '../../src/analyser/rule-based/checkers/maintainability/god-sprite';
import { checkMagicNumbers } from '../../src/analyser/rule-based/checkers/maintainability/magic-numbers';
import { makeTarget, makeHatBlock, makeBlock, makeStage, resetIds, freshId } from '../fixtures/builders';

beforeEach(resetIds);

describe('script-length', () => {
  test('no finding for short script', () => {
    const hatId = freshId();
    const bodyId = freshId();
    const target = makeTarget({
      blocks: {
        [hatId]: makeHatBlock(hatId, bodyId),
        [bodyId]: makeBlock({ opcode: 'motion_movesteps' }),
      },
    });
    expect(checkScriptLength(target)).toHaveLength(0);
  });

  test('warning for script with >= 20 blocks', () => {
    const hatId = freshId();
    const blockIds: string[] = [];
    for (let i = 0; i < 22; i++) blockIds.push(freshId());
    const blocks: Record<string, ReturnType<typeof makeBlock>> = {
      [hatId]: makeHatBlock(hatId, blockIds[0]),
    };
    for (let i = 0; i < blockIds.length; i++) {
      blocks[blockIds[i]] = makeBlock({ opcode: 'motion_movesteps', next: blockIds[i + 1] ?? null });
    }
    const target = makeTarget({ blocks });
    const findings = checkScriptLength(target);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
  });
});

describe('naming-conventions', () => {
  test('flags generic variable name', () => {
    const target = makeTarget({ variables: { v1: ['my variable', 0] } });
    const findings = checkNamingConventions(target, [target]);
    const found = findings.find((f) => f.description.includes('my variable'));
    expect(found).toBeDefined();
    expect(found?.severity).toBe('warning');
  });

  test('flags default sprite name', () => {
    const target = makeTarget({ name: 'Sprite1' });
    const findings = checkNamingConventions(target, [target]);
    expect(findings.some((f) => f.description.includes('Sprite1'))).toBe(true);
  });

  test('no sprite name finding for Stage', () => {
    const stage = makeStage();
    const findings = checkNamingConventions(stage, [stage]);
    expect(findings.every((f) => !f.description.includes('Stage'))).toBe(true);
  });

  test('flags unused variable', () => {
    const target = makeTarget({ variables: { v1: ['myScore', 0] } });
    const findings = checkNamingConventions(target, [target]);
    expect(findings.some((f) => f.description.includes('never used'))).toBe(true);
  });
});

describe('dead-custom-blocks', () => {
  test('flags defined but uncalled custom block', () => {
    const id = freshId();
    const target = makeTarget({
      blocks: {
        [id]: makeBlock({
          opcode: 'procedures_definition',
          topLevel: true,
          mutation: { proccode: 'myBlock %s' },
        }),
      },
    });
    const findings = checkDeadCustomBlocks(target);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('info');
  });

  test('no finding when custom block is called', () => {
    const defId = freshId();
    const callId = freshId();
    const target = makeTarget({
      blocks: {
        [defId]: makeBlock({
          opcode: 'procedures_definition',
          topLevel: true,
          mutation: { proccode: 'myBlock %s' },
        }),
        [callId]: makeBlock({
          opcode: 'procedures_call',
          mutation: { proccode: 'myBlock %s' },
        }),
      },
    });
    expect(checkDeadCustomBlocks(target)).toHaveLength(0);
  });
});

describe('god-sprite', () => {
  test('no finding for sprite with few scripts', () => {
    const id = freshId();
    const target = makeTarget({ blocks: { [id]: makeHatBlock(id) } });
    expect(checkGodSprite(target)).toHaveLength(0);
  });

  test('warning for sprite with >= 15 scripts', () => {
    const blocks: Record<string, ReturnType<typeof makeBlock>> = {};
    for (let i = 0; i < 16; i++) {
      const id = freshId();
      blocks[id] = makeHatBlock(id);
    }
    const target = makeTarget({ blocks });
    const findings = checkGodSprite(target);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
  });

  test('no finding for Stage even with many scripts', () => {
    const blocks: Record<string, ReturnType<typeof makeBlock>> = {};
    for (let i = 0; i < 20; i++) {
      const id = freshId();
      blocks[id] = makeHatBlock(id);
    }
    expect(checkGodSprite(makeStage({ blocks }))).toHaveLength(0);
  });
});

describe('magic-numbers', () => {
  test('flags number appearing 3+ times', () => {
    const blocks: Record<string, ReturnType<typeof makeBlock>> = {};
    for (let i = 0; i < 3; i++) {
      const id = freshId();
      blocks[id] = makeBlock({ opcode: 'motion_movesteps', inputs: { STEPS: [1, [4, '42']] } });
    }
    const target = makeTarget({ blocks });
    const findings = checkMagicNumbers(target);
    expect(findings).toHaveLength(1);
    expect(findings[0].description).toContain('42');
  });

  test('no finding for exempt number', () => {
    const blocks: Record<string, ReturnType<typeof makeBlock>> = {};
    for (let i = 0; i < 3; i++) {
      const id = freshId();
      blocks[id] = makeBlock({ opcode: 'motion_movesteps', inputs: { STEPS: [1, [4, '10']] } });
    }
    const target = makeTarget({ blocks });
    expect(checkMagicNumbers(target)).toHaveLength(0);
  });
});
