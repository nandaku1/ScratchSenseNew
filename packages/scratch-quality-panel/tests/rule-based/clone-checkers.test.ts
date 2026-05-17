// STAGE 6 — tests for clone-related checkers

import { checkClonesWithoutDeletion } from '../../src/analyser/rule-based/checkers/correctness/clones-without-deletion';
import { checkCloneBomb } from '../../src/analyser/rule-based/checkers/correctness/clone-bomb';
import { makeTarget, makeBlock, makeStage, resetIds, freshId } from '../fixtures/builders';

beforeEach(resetIds);

describe('clones-without-deletion', () => {
  test('flags when clone is created but never deleted anywhere', () => {
    const id = freshId();
    const sprite = makeTarget({
      blocks: { [id]: makeBlock({ opcode: 'control_create_clone_of' }) },
    });
    const findings = checkClonesWithoutDeletion([makeStage(), sprite]);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('warning');
  });

  test('no finding when deletion exists in another sprite', () => {
    const createId = freshId();
    const deleteId = freshId();
    const sprite1 = makeTarget({
      blocks: { [createId]: makeBlock({ opcode: 'control_create_clone_of' }) },
    });
    const sprite2 = makeTarget({
      name: 'Sprite2',
      blocks: { [deleteId]: makeBlock({ opcode: 'control_delete_this_clone' }) },
    });
    expect(checkClonesWithoutDeletion([makeStage(), sprite1, sprite2])).toHaveLength(0);
  });
});

describe('clone-bomb', () => {
  test('flags create-clone inside start-as-clone script', () => {
    const createId = freshId();
    const hatId = freshId();
    const sprite = makeTarget({
      blocks: {
        [createId]: makeBlock({ opcode: 'control_create_clone_of' }),
        [hatId]: makeBlock({ opcode: 'control_start_as_clone', topLevel: true, next: createId }),
      },
    });
    const findings = checkCloneBomb(sprite);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('error');
  });

  test('no finding for normal clone creation', () => {
    const createId = freshId();
    const sprite = makeTarget({
      blocks: { [createId]: makeBlock({ opcode: 'control_create_clone_of' }) },
    });
    expect(checkCloneBomb(sprite)).toHaveLength(0);
  });
});
