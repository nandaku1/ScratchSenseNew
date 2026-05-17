// Tests for new checkers added from Frädrich et al. (2020) catalogue

import {
  checkStutteringMovement,
} from '../../src/analyser/rule-based/checkers/correctness/stuttering-movement';
import {
  checkMissingBackdropSwitch,
} from '../../src/analyser/rule-based/checkers/correctness/missing-backdrop-switch';
import {
  checkPositionEquals,
} from '../../src/analyser/rule-based/checkers/correctness/position-equals';
import {
  checkComparingLiterals,
} from '../../src/analyser/rule-based/checkers/correctness/comparing-literals';
import {
  checkForeverInsideLoop,
} from '../../src/analyser/rule-based/checkers/correctness/forever-inside-loop';
import {
  checkMissingCloneCall,
} from '../../src/analyser/rule-based/checkers/correctness/missing-clone-call';
import {
  checkMissingCloneInitialisation,
} from '../../src/analyser/rule-based/checkers/correctness/missing-clone-initialisation';
import {
  checkParameterOutOfScope,
} from '../../src/analyser/rule-based/checkers/correctness/parameter-out-of-scope';
import {
  checkExpressionAsTouchable,
} from '../../src/analyser/rule-based/checkers/correctness/expression-as-touchable';
import {
  checkDeadCustomBlocks,
} from '../../src/analyser/rule-based/checkers/maintainability/dead-custom-blocks';
import { makeBlock, makeTarget, makeStage, freshId, resetIds } from '../fixtures/builders';

beforeEach(resetIds);

// ---------------------------------------------------------------------------
// Stuttering Movement
// ---------------------------------------------------------------------------
describe('checkStutteringMovement', () => {
  test('flags when-key-pressed script whose body is only motion blocks', () => {
    const hatId = freshId();
    const moveId = freshId();
    const target = makeTarget({
      blocks: {
        [hatId]: makeBlock({
          opcode: 'event_whenkeypressed',
          next: moveId,
          topLevel: true,
          fields: { KEY_OPTION: ['right arrow', null] },
        }),
        [moveId]: makeBlock({ opcode: 'motion_movesteps', parent: hatId }),
      },
    });
    const findings = checkStutteringMovement(target);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
    expect(findings[0].title).toBe('Stuttering Movement');
  });

  test('no finding when key-press body contains a non-motion block', () => {
    const hatId = freshId();
    const loopId = freshId();
    const target = makeTarget({
      blocks: {
        [hatId]: makeBlock({ opcode: 'event_whenkeypressed', next: loopId, topLevel: true }),
        [loopId]: makeBlock({ opcode: 'control_forever', parent: hatId }),
      },
    });
    expect(checkStutteringMovement(target)).toHaveLength(0);
  });

  test('no finding for empty key-press script (no next block)', () => {
    const hatId = freshId();
    const target = makeTarget({
      blocks: {
        [hatId]: makeBlock({ opcode: 'event_whenkeypressed', topLevel: true }),
      },
    });
    expect(checkStutteringMovement(target)).toHaveLength(0);
  });

  test('no finding when body mixes motion with broadcast (paper edge case: non-motion opcode present)', () => {
    const hatId = freshId();
    const moveId = freshId();
    const bcastId = freshId();
    const target = makeTarget({
      blocks: {
        [hatId]: makeBlock({ opcode: 'event_whenkeypressed', next: moveId, topLevel: true }),
        [moveId]: makeBlock({ opcode: 'motion_movesteps', parent: hatId, next: bcastId }),
        [bcastId]: makeBlock({ opcode: 'event_broadcast', parent: moveId }),
      },
    });
    expect(checkStutteringMovement(target)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Missing Backdrop Switch
// ---------------------------------------------------------------------------
describe('checkMissingBackdropSwitch', () => {
  test('flags when-backdrop-switches-to handler with no matching switch call', () => {
    const hatId = freshId();
    const sprite = makeTarget({
      name: 'Cat',
      blocks: {
        [hatId]: makeBlock({
          opcode: 'event_whenbackdropswitchesto',
          topLevel: true,
          fields: { BACKDROP: ['level2', null] },
        }),
      },
    });
    const findings = checkMissingBackdropSwitch([makeStage(), sprite]);
    expect(findings).toHaveLength(1);
    expect(findings[0].description).toContain('level2');
    expect(findings[0].severity).toBe('error');
  });

  test('no finding when matching switch-backdrop call exists', () => {
    const hatId = freshId();
    const switchId = freshId();
    const menuId = freshId();
    const sprite = makeTarget({
      name: 'Cat',
      blocks: {
        [hatId]: makeBlock({
          opcode: 'event_whenbackdropswitchesto',
          topLevel: true,
          fields: { BACKDROP: ['level2', null] },
        }),
        [switchId]: makeBlock({
          opcode: 'looks_switchbackdropto',
          inputs: { BACKDROP: [1, menuId] },
        }),
        [menuId]: makeBlock({
          opcode: 'looks_backdrop',
          shadow: true,
          fields: { BACKDROP: ['level2', null] },
        }),
      },
    });
    expect(checkMissingBackdropSwitch([makeStage(), sprite])).toHaveLength(0);
  });

  test('match is case-insensitive (normalised names)', () => {
    const hatId = freshId();
    const switchId = freshId();
    const menuId = freshId();
    const sprite = makeTarget({
      name: 'Cat',
      blocks: {
        [hatId]: makeBlock({
          opcode: 'event_whenbackdropswitchesto',
          topLevel: true,
          fields: { BACKDROP: ['Level2', null] },
        }),
        [switchId]: makeBlock({
          opcode: 'looks_switchbackdropto',
          inputs: { BACKDROP: [1, menuId] },
        }),
        [menuId]: makeBlock({
          opcode: 'looks_backdrop',
          shadow: true,
          fields: { BACKDROP: ['level2', null] },
        }),
      },
    });
    expect(checkMissingBackdropSwitch([makeStage(), sprite])).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Position Equals
// ---------------------------------------------------------------------------
describe('checkPositionEquals', () => {
  test('flags equals check against x position', () => {
    const eqId = freshId();
    const xposId = freshId();
    const target = makeTarget({
      blocks: {
        [eqId]: makeBlock({
          opcode: 'operator_equals',
          inputs: { OPERAND1: [3, xposId], OPERAND2: [1, [4, '50']] },
        }),
        [xposId]: makeBlock({ opcode: 'motion_xposition', parent: eqId }),
      },
    });
    const findings = checkPositionEquals(target);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
  });

  test('flags equals check against y position', () => {
    const eqId = freshId();
    const yposId = freshId();
    const target = makeTarget({
      blocks: {
        [eqId]: makeBlock({
          opcode: 'operator_equals',
          inputs: { OPERAND1: [1, [4, '0']], OPERAND2: [3, yposId] },
        }),
        [yposId]: makeBlock({ opcode: 'motion_yposition', parent: eqId }),
      },
    });
    expect(checkPositionEquals(target)).toHaveLength(1);
  });

  test('no finding when comparing two variable reporters (not position)', () => {
    const eqId = freshId();
    const varId = freshId();
    const target = makeTarget({
      blocks: {
        [eqId]: makeBlock({
          opcode: 'operator_equals',
          inputs: { OPERAND1: [3, varId], OPERAND2: [1, [10, '5']] },
        }),
        [varId]: makeBlock({
          opcode: 'data_variable',
          fields: { VARIABLE: ['score', 'v1'] },
          parent: eqId,
        }),
      },
    });
    expect(checkPositionEquals(target)).toHaveLength(0);
  });

  test('no finding for operator_gt with position (only = is flagged)', () => {
    const eqId = freshId();
    const xposId = freshId();
    const target = makeTarget({
      blocks: {
        [eqId]: makeBlock({
          opcode: 'operator_gt',
          inputs: { OPERAND1: [3, xposId], OPERAND2: [1, [4, '50']] },
        }),
        [xposId]: makeBlock({ opcode: 'motion_xposition', parent: eqId }),
      },
    });
    expect(checkPositionEquals(target)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Comparing Literals
// ---------------------------------------------------------------------------
describe('checkComparingLiterals', () => {
  test('flags operator_equals with both operands as literals', () => {
    const id = freshId();
    const target = makeTarget({
      blocks: {
        [id]: makeBlock({
          opcode: 'operator_equals',
          inputs: { OPERAND1: [1, [10, 'hello']], OPERAND2: [1, [10, 'hello']] },
        }),
      },
    });
    const findings = checkComparingLiterals(target);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
  });

  test('flags operator_gt with both operands as numeric literals', () => {
    const id = freshId();
    const target = makeTarget({
      blocks: {
        [id]: makeBlock({
          opcode: 'operator_gt',
          inputs: { OPERAND1: [1, [4, '10']], OPERAND2: [1, [4, '5']] },
        }),
      },
    });
    expect(checkComparingLiterals(target)).toHaveLength(1);
  });

  test('no finding when one operand is a variable reporter', () => {
    const eqId = freshId();
    const varId = freshId();
    const target = makeTarget({
      blocks: {
        [eqId]: makeBlock({
          opcode: 'operator_equals',
          inputs: { OPERAND1: [3, varId], OPERAND2: [1, [4, '10']] },
        }),
        [varId]: makeBlock({ opcode: 'data_variable', fields: { VARIABLE: ['score', 'v1'] } }),
      },
    });
    expect(checkComparingLiterals(target)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Forever Inside Loop
// ---------------------------------------------------------------------------
describe('checkForeverInsideLoop', () => {
  test('flags forever nested inside repeat', () => {
    const repeatId = freshId();
    const foreverId = freshId();
    const target = makeTarget({
      blocks: {
        [repeatId]: makeBlock({
          opcode: 'control_repeat',
          inputs: { TIMES: [1, [4, '10']], SUBSTACK: [2, foreverId] },
        }),
        [foreverId]: makeBlock({ opcode: 'control_forever', parent: repeatId }),
      },
    });
    const findings = checkForeverInsideLoop(target);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
    expect(findings[0].blockId).toBe(foreverId);
  });

  test('flags forever nested inside another forever (edge case from paper)', () => {
    const outerForeverId = freshId();
    const innerForeverId = freshId();
    const target = makeTarget({
      blocks: {
        [outerForeverId]: makeBlock({
          opcode: 'control_forever',
          inputs: { SUBSTACK: [2, innerForeverId] },
          topLevel: true,
        }),
        [innerForeverId]: makeBlock({ opcode: 'control_forever', parent: outerForeverId }),
      },
    });
    const findings = checkForeverInsideLoop(target);
    // Only the inner forever should be flagged (it has a loop ancestor)
    expect(findings).toHaveLength(1);
    expect(findings[0].blockId).toBe(innerForeverId);
  });

  test('no finding for top-level forever', () => {
    const hatId = freshId();
    const foreverId = freshId();
    const target = makeTarget({
      blocks: {
        [hatId]: makeBlock({ opcode: 'event_whenflagclicked', next: foreverId, topLevel: true }),
        [foreverId]: makeBlock({ opcode: 'control_forever', parent: hatId }),
      },
    });
    expect(checkForeverInsideLoop(target)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Missing Clone Call
// ---------------------------------------------------------------------------
describe('checkMissingCloneCall', () => {
  test('flags sprite with clone handler but no create-clone call anywhere', () => {
    const hatId = freshId();
    const sprite = makeTarget({
      name: 'Enemy',
      blocks: {
        [hatId]: makeBlock({ opcode: 'control_start_as_clone', topLevel: true }),
      },
    });
    const findings = checkMissingCloneCall([makeStage(), sprite]);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('error');
    expect(findings[0].description).toContain('Enemy');
  });

  test('no finding when project contains a matching create-clone call (_myself_)', () => {
    const handlerHatId = freshId();
    const createId = freshId();
    const menuId = freshId();
    const sprite = makeTarget({
      name: 'Enemy',
      blocks: {
        [handlerHatId]: makeBlock({ opcode: 'control_start_as_clone', topLevel: true }),
        [createId]: makeBlock({
          opcode: 'control_create_clone_of',
          inputs: { CLONE_OPTION: [1, menuId] },
        }),
        [menuId]: makeBlock({
          opcode: 'control_create_clone_of_menu',
          shadow: true,
          fields: { CLONE_OPTION: ['_myself_', null] },
        }),
      },
    });
    expect(checkMissingCloneCall([makeStage(), sprite])).toHaveLength(0);
  });

  test('no finding when another sprite explicitly clones this sprite', () => {
    const hatId = freshId();
    const enemy = makeTarget({
      name: 'Enemy',
      blocks: {
        [hatId]: makeBlock({ opcode: 'control_start_as_clone', topLevel: true }),
      },
    });
    const createId = freshId();
    const menuId = freshId();
    const spawner = makeTarget({
      name: 'Spawner',
      blocks: {
        [createId]: makeBlock({
          opcode: 'control_create_clone_of',
          inputs: { CLONE_OPTION: [1, menuId] },
        }),
        [menuId]: makeBlock({
          opcode: 'control_create_clone_of_menu',
          shadow: true,
          fields: { CLONE_OPTION: ['Enemy', null] },
        }),
      },
    });
    expect(checkMissingCloneCall([makeStage(), enemy, spawner])).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Missing Clone Initialisation
// ---------------------------------------------------------------------------
describe('checkMissingCloneInitialisation', () => {
  test('flags create-clone call when target sprite has no clone handler', () => {
    const createId = freshId();
    const menuId = freshId();
    const spawner = makeTarget({
      name: 'Spawner',
      blocks: {
        [createId]: makeBlock({
          opcode: 'control_create_clone_of',
          inputs: { CLONE_OPTION: [1, menuId] },
        }),
        [menuId]: makeBlock({
          opcode: 'control_create_clone_of_menu',
          shadow: true,
          fields: { CLONE_OPTION: ['Enemy', null] },
        }),
      },
    });
    const enemy = makeTarget({ name: 'Enemy', blocks: {} });
    const findings = checkMissingCloneInitialisation([makeStage(), spawner, enemy]);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
    expect(findings[0].description).toContain('Enemy');
  });

  test('no finding when cloned sprite has a start-as-clone handler', () => {
    const createId = freshId();
    const menuId = freshId();
    const handlerHatId = freshId();
    const spawner = makeTarget({
      name: 'Spawner',
      blocks: {
        [createId]: makeBlock({
          opcode: 'control_create_clone_of',
          inputs: { CLONE_OPTION: [1, menuId] },
        }),
        [menuId]: makeBlock({
          opcode: 'control_create_clone_of_menu',
          shadow: true,
          fields: { CLONE_OPTION: ['Enemy', null] },
        }),
      },
    });
    const enemy = makeTarget({
      name: 'Enemy',
      blocks: {
        [handlerHatId]: makeBlock({ opcode: 'control_start_as_clone', topLevel: true }),
      },
    });
    expect(checkMissingCloneInitialisation([makeStage(), spawner, enemy])).toHaveLength(0);
  });

  test('_myself_ create-clone where owner has no handler is flagged (paper edge case)', () => {
    const createId = freshId();
    const menuId = freshId();
    const sprite = makeTarget({
      name: 'Ball',
      blocks: {
        [createId]: makeBlock({
          opcode: 'control_create_clone_of',
          inputs: { CLONE_OPTION: [1, menuId] },
        }),
        [menuId]: makeBlock({
          opcode: 'control_create_clone_of_menu',
          shadow: true,
          fields: { CLONE_OPTION: ['_myself_', null] },
        }),
      },
    });
    const findings = checkMissingCloneInitialisation([makeStage(), sprite]);
    expect(findings).toHaveLength(1);
    expect(findings[0].description).toContain('Ball');
  });
});

// ---------------------------------------------------------------------------
// Parameter Out Of Scope
// ---------------------------------------------------------------------------
describe('checkParameterOutOfScope', () => {
  test('flags argument reporter not inside a procedures_definition', () => {
    const argId = freshId();
    const target = makeTarget({
      blocks: {
        [argId]: makeBlock({
          opcode: 'argument_reporter_string_number',
          fields: { VALUE: ['num', null] },
          topLevel: false,
        }),
      },
    });
    const findings = checkParameterOutOfScope(target);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('error');
    expect(findings[0].description).toContain('num');
  });

  test('no finding when argument reporter is inside a procedures_definition', () => {
    const defId = freshId();
    const moveId = freshId();
    const argId = freshId();
    const target = makeTarget({
      blocks: {
        [defId]: makeBlock({
          opcode: 'procedures_definition',
          next: moveId,
          topLevel: true,
          mutation: { proccode: 'move %s steps' },
        }),
        [moveId]: makeBlock({
          opcode: 'motion_movesteps',
          parent: defId,
          inputs: { STEPS: [3, argId] },
        }),
        [argId]: makeBlock({
          opcode: 'argument_reporter_string_number',
          fields: { VALUE: ['num', null] },
          parent: moveId,
        }),
      },
    });
    expect(checkParameterOutOfScope(target)).toHaveLength(0);
  });

  test('flags boolean argument reporter out of scope (paper edge case)', () => {
    const argId = freshId();
    const target = makeTarget({
      blocks: {
        [argId]: makeBlock({
          opcode: 'argument_reporter_boolean',
          fields: { VALUE: ['flag', null] },
        }),
      },
    });
    expect(checkParameterOutOfScope(target)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Expression As Touchable
// ---------------------------------------------------------------------------
describe('checkExpressionAsTouchable', () => {
  test('flags sensing_touchingobject when a reporter replaces the menu', () => {
    const touchId = freshId();
    const varId = freshId();
    const target = makeTarget({
      blocks: {
        [touchId]: makeBlock({
          opcode: 'sensing_touchingobject',
          inputs: { TOUCHINGOBJECTMENU: [3, varId] },
        }),
        [varId]: makeBlock({
          opcode: 'data_variable',
          fields: { VARIABLE: ['target', 'v1'] },
          shadow: false,
          parent: touchId,
        }),
      },
    });
    const findings = checkExpressionAsTouchable(target);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('error');
  });

  test('no finding when sensing_touchingobject uses a shadow menu block', () => {
    const touchId = freshId();
    const menuId = freshId();
    const target = makeTarget({
      blocks: {
        [touchId]: makeBlock({
          opcode: 'sensing_touchingobject',
          inputs: { TOUCHINGOBJECTMENU: [1, menuId] },
        }),
        [menuId]: makeBlock({
          opcode: 'sensing_touchingobjectmenu',
          shadow: true,
          fields: { TOUCHINGOBJECTMENU: ['Ball', null] },
          parent: touchId,
        }),
      },
    });
    expect(checkExpressionAsTouchable(target)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Dead Custom Blocks — call-without-definition extension
// ---------------------------------------------------------------------------
describe('checkDeadCustomBlocks — call without definition', () => {
  test('flags procedures_call with no matching procedures_definition', () => {
    const callId = freshId();
    const target = makeTarget({
      blocks: {
        [callId]: makeBlock({
          opcode: 'procedures_call',
          mutation: { proccode: 'myBlock %s' },
        }),
      },
    });
    const findings = checkDeadCustomBlocks(target);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('error');
    expect(findings[0].description).toContain('myBlock %s');
  });

  test('no finding when call has a matching definition', () => {
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

  test('both directions flagged independently: dead def + orphan call', () => {
    const defId = freshId();
    const callId = freshId();
    const target = makeTarget({
      blocks: {
        [defId]: makeBlock({
          opcode: 'procedures_definition',
          topLevel: true,
          mutation: { proccode: 'unusedBlock' },
        }),
        [callId]: makeBlock({
          opcode: 'procedures_call',
          mutation: { proccode: 'missingBlock' },
        }),
      },
    });
    const findings = checkDeadCustomBlocks(target);
    expect(findings).toHaveLength(2);
    const severities = findings.map(f => f.severity).sort();
    expect(severities).toEqual(['error', 'info']);
  });
});
